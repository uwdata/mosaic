package main

import (
	"context"
	"database/sql/driver"
	"flag"
	"fmt"
	"log/slog"
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
	certFile := flag.String("cert", "", "Path to TLS certificate file (optional, enables HTTPS)")
	keyFile := flag.String("key", "", "Path to TLS private key file (optional, enables HTTPS)")
	cacheControl := flag.String("cache-control", "", "Cache-Control value for successful GET arrow responses; enables ETag validation for those queries")
	var varyHeaders optionalCommaListFlag
	flag.Var(&varyHeaders, "vary", "Comma-separated request header names to append to Vary; may be repeated")
	extensionsStr := flag.String("load-extensions", "", "Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify a DuckDB repository alias. Unspecified repositories use DuckDB's default (e.g. mysql_scanner,netquack|community,aws|core_nightly).")
	var gatekeeper gatekeeperFlag
	flag.Var(&gatekeeper, "gatekeeper", `Gatekeeper JSON policy document; {"version":1,"options":{}} enables validation with defaults`)
	flag.Parse()

	ctx := context.Background()

	logLevel := slog.LevelDebug
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	if err := extensions.Validate(*extensionsStr); err != nil {
		logger.Error("main: invalid load-extensions", "error", err, "load-extensions", *extensionsStr)
		return 1
	}

	// If no certificate files are specified, check for default localhost certificates
	if *certFile == "" && *keyFile == "" {
		// Check if localhost.pem and localhost-key.pem exist in the current directory
		if _, err := os.Stat("localhost.pem"); err == nil {
			if _, err = os.Stat("localhost-key.pem"); err == nil {
				*certFile = "localhost.pem"
				*keyFile = "localhost-key.pem"
				logger.Info("main: found default certificates in current directory", "cert", *certFile, "key", *keyFile)
			}
		}
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

	addr := *address + ":" + *port

	// Check if both certificate files are provided for HTTPS
	if *certFile != "" && *keyFile != "" {
		logger.Info(fmt.Sprintf("DuckDB Server listening on https://%s and wss://%s", addr, addr))
		err = http.ListenAndServeTLS(addr, *certFile, *keyFile, s)
	} else {
		if *certFile != "" || *keyFile != "" {
			logger.Warn("main: both cert and key files must be provided for HTTPS. Falling back to HTTP")
		}
		logger.Info(fmt.Sprintf("DuckDB Server listening on http://%s and ws://%s", addr, addr))
		err = http.ListenAndServe(addr, s)
	}
	if err != nil {
		logger.Error("main: error running HTTP server", "error", err)
		return 1
	}
	return 0
}
