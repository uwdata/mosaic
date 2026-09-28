package main

import (
	"context"
	"database/sql/driver"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/duckdb/duckdb-go/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/server"
)

func main() {
	os.Exit(run())
}

func run() int {
	dbPath := flag.String("database", ":memory:", "Path of database file (e.g., \"database.db\". \":memory:\" for in-memory database)")
	address := flag.String("address", "localhost", "HTTP Address")
	port := flag.String("port", "3000", "HTTP Port")
	poolSize := flag.Int("connection-pool-size", 10, "Max connection pool size")
	https := flag.Bool("https", false, "Enable HTTPS with automatically managed localhost certificates")
	certFile := flag.String("cert", "", "Path to TLS certificate file (optional, enables HTTPS)")
	keyFile := flag.String("key", "", "Path to TLS private key file (optional, enables HTTPS)")
	cacheControl := flag.String("cache-control", "", "Cache-Control value for successful GET arrow responses; enables ETag validation for those queries")
	var varyHeaders optionalCommaListFlag
	flag.Var(&varyHeaders, "vary", "Comma-separated request header names to append to Vary; may be repeated")
	extensionsStr := flag.String("load-extensions", "", "Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify a DuckDB repository alias. Unspecified repositories use DuckDB's default (e.g. mysql_scanner,netquack|community,aws|core_nightly).")
	var gatekeeper gatekeeperFlag
	flag.Var(&gatekeeper, "gatekeeper", `Gatekeeper JSON policy document; {"version":1,"options":{}} enables validation with defaults`)
	flag.Parse()
	*address = normalizeAddress(*address)

	ctx := context.Background()

	logLevel := slog.LevelDebug
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	if err := extensions.Validate(*extensionsStr); err != nil {
		logger.Error("main: invalid load-extensions", "error", err, "load-extensions", *extensionsStr)
		return 1
	}

	tlsConfig, err := configureHTTPS(*https, *address, *certFile, *keyFile, logger)
	if err != nil {
		logger.Error("main: HTTPS setup failed", "error", err)
		return 1
	}

	validation := gatekeeper.document != nil
	var initializeOnce sync.Once
	var initializeErr error
	connector, err := duckdb.NewConnector(*dbPath, func(execer driver.ExecerContext) error {
		initializeOnce.Do(func() {
			initializeErr = initializeDatabase(ctx, execer, *extensionsStr, gatekeeper.document)
		})
		return initializeErr
	})
	if err != nil {
		logger.Error("main: error creating duckdb connector", "error", err)
		return 1
	}
	defer func() {
		err = connector.Close()
		if err != nil {
			logger.Error("main: error closing duckdb connector", "error", err)
		}
	}()

	queryOptions := []query.OptionFunc{
		query.WithMaxConnections(*poolSize),
		query.WithLogger(logger),
	}
	if validation {
		queryOptions = append(queryOptions, query.WithValidation())
	}

	db, err := query.New(ctx, connector, queryOptions...)
	if err != nil {
		logger.Error("main: error creating query DB", "error", err)
		return 1
	}
	defer db.Close()

	s, err := server.New(db,
		server.WithCacheControl(*cacheControl),
		server.WithVary(varyHeaders.values...),
		server.WithLogger(logger),
		server.WithCORS(server.CORSOptions{
			AllowAllOrigins: true,
			AllowAllHeaders: true,
			MaxAge:          30 * 24 * time.Hour,
		}),
		server.WithWebSocket(server.WebSocketOptions{AllowAllOrigins: true}),
	)
	if err != nil {
		logger.Error("main: error creating server", "error", err)
		return 1
	}
	logger.Warn("DuckDB Server permits all HTTP and WebSocket origins for compatibility; enforce an outer origin or CSRF policy before exposing it to untrusted browsers")

	config := map[string]interface{}{
		"database":             *dbPath,
		"address":              *address,
		"port":                 *port,
		"connection_pool_size": *poolSize,
		"cert_file":            *certFile,
		"key_file":             *keyFile,
		"https":                tlsConfig != nil,
		"cache_control":        *cacheControl,
		"vary":                 varyHeaders.String(),
		"load_extensions":      *extensionsStr,
		"gatekeeper":           gatekeeper.String(),
	}
	logger.Info("DuckDB Server configuration", "config", config)

	extensions, err := db.GetExtensions(ctx)
	if err != nil {
		logger.Error("main: error getting extensions", "error", err)
		return 1
	}

	logger.Info("DuckDB Server Extensions", "extensions", extensions)

	fmt.Println("DuckDB Server Extensions:")
	fmt.Printf("%-20s | %-8s | %-20s | %-20s\n", "name", "version", "repository", "install_mode")
	fmt.Println("-------------------- | -------- | -------------------- | --------------------")
	for _, extension := range extensions {
		fmt.Printf("%-20s | %-8s | %-20s | %-20s\n", extension.Name, extension.Version, extension.Repository, extension.InstallMode)
	}
	fmt.Println("-------------------- | -------- | -------------------- | --------------------")

	addr := net.JoinHostPort(*address, *port)
	httpServer := &http.Server{Addr: addr, Handler: s, TLSConfig: tlsConfig, ReadHeaderTimeout: 10 * time.Second}

	if tlsConfig != nil {
		logger.Info(fmt.Sprintf("DuckDB Server listening on https://%s and wss://%s", addr, addr))
		err = httpServer.ListenAndServeTLS("", "")
	} else {
		logger.Info(fmt.Sprintf("DuckDB Server listening on http://%s and ws://%s", addr, addr))
		err = httpServer.ListenAndServe()
	}
	if err != nil {
		logger.Error("main: error running HTTP server", "error", err)
		return 1
	}
	return 0
}

// initializeDatabase is the CLI's trusted initialization. Extensions named by --load-extensions are installed first so
// a locally provided Gatekeeper artifact wins over the community install; the community install only runs when LOAD
// finds nothing.
func initializeDatabase(ctx context.Context, execer driver.ExecerContext, extensionList string, document *string) error {
	if err := extensions.ParseAndInstall(ctx, execer, extensionList); err != nil {
		return err
	}
	if document == nil {
		return nil
	}
	if err := extensions.LoadInstalled(ctx, execer, "gatekeeper"); err != nil {
		if err := extensions.InstallAndLoad(ctx, execer, "gatekeeper", "community"); err != nil {
			return err
		}
	}
	if err := query.ConfigureGatekeeper(ctx, execer, *document); err != nil {
		return fmt.Errorf("configure Gatekeeper: %w", err)
	}
	_, err := execer.ExecContext(ctx, `SET autoload_known_extensions = false;
		SET autoinstall_known_extensions = false; SET lock_configuration = true`, nil)
	return err
}
