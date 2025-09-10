package main

import (
	"context"
	"database/sql/driver"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/marcboeker/go-duckdb/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/query"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/server"
)

func main() {
	dbPath := flag.String("database", ":memory:", "Path of database file (e.g., \"database.db\". \":memory:\" for in-memory database)")
	address := flag.String("address", "localhost", "HTTP Address")
	port := flag.String("port", "3000", "HTTP Port")
	poolSize := flag.Int("connection-pool-size", 10, "Max connection pool size")
	maxCacheEntries := flag.Int("max-cache-entries", 1000, "Max number of cache entries")
	maxCacheBytes := flag.Int("max-cache-bytes", 0, "Max number of cache size in bytes (overrides max-cache-entries if both are set)")
	ttlStr := flag.String("cache-ttl", "0s", "Time-to-live for cache entries as a Go duration. 0s means no expiration (e.g., '10m', '1h'). Defaults to 0s.")
	certFile := flag.String("cert", "", "Path to TLS certificate file (optional, enables HTTPS)")
	keyFile := flag.String("key", "", "Path to TLS private key file (optional, enables HTTPS)")
	schemaMatchHeadersStr := flag.String("schema-match-headers", "", "Comma-separated list of headers to match against schema names for multi-tenant access control (e.g., \"X-Tenant-Id,verified-user-id\")")
	extensionsStr := flag.String("load-extensions", "", "Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify the repository. Unspecified repositories will default to 'core'. (e.g. mysql_scanner,netquack|community,aws|core_nightly")
	flag.Parse()

	var schemaMatchHeaders []string
	if *schemaMatchHeadersStr != "" {
		schemaMatchHeaders = strings.Split(*schemaMatchHeadersStr, ",")
	}

	ctx := context.Background()

	logLevel := slog.LevelDebug
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

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

	// Create DuckDB connector for Arrow support
	connector, err := duckdb.NewConnector(*dbPath, extensionLoader(ctx, extensionsStr, logger))
	if err != nil {
		logger.Error("main: error creating duckdb connector", "error", err)
		return
	}
	defer func() {
		err = connector.Close()
		if err != nil {
			logger.Error("main: error closing duckdb connector", "error", err)
		}
	}()

	ttl, err := time.ParseDuration(*ttlStr)
	if err != nil {
		logger.Error("main: invalid cache-ttl", "error", err)
		return
	}

	db, err := query.New(ctx, connector,
		query.WithMaxConnections(*poolSize),
		query.WithMaxCacheEntries(*maxCacheEntries),
		query.WithMaxCacheBytes(*maxCacheBytes),
		query.WithTTL(ttl),
		query.WithLogger(logger),
	)
	if err != nil {
		logger.Error("main: error creating query DB", "error", err)
		return
	}
	defer db.Close()

	s := server.New(db, schemaMatchHeaders, logger)

	config := map[string]interface{}{
		"database":             *dbPath,
		"address":              *address,
		"port":                 *port,
		"connection_pool_size": *poolSize,
		"cache_size":           *maxCacheEntries,
		"cert_file":            *certFile,
		"key_file":             *keyFile,
		"schema_match_headers": *schemaMatchHeadersStr,
		"ttl":                  ttl,
		"max_cache_bytes":      *maxCacheBytes,
		"load_extensions":      *extensionsStr,
	}
	logger.Info("DuckDB Server configuration", "config", config)

	extensions, err := db.GetExtensions(ctx)
	if err != nil {
		logger.Error("main: error getting extensions", "error", err)
		return
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
		return
	}
}

func extensionLoader(ctx context.Context, extensionsStr *string, logger *slog.Logger) func(execer driver.ExecerContext) error {
	return func(execer driver.ExecerContext) error {
		if extensionsStr == nil || *extensionsStr == "" {
			return nil
		}

		extensions := strings.Split(*extensionsStr, ",")
		for _, extension := range extensions {
			name, repo, _ := strings.Cut(extension, "|")
			name = strings.TrimSpace(name)
			repo = strings.TrimSpace(repo)

			switch repo {
			case "":
				repo = "core" // default repository
				fallthrough

			case "core", "core_nightly", "community", "local_build_debug", "local_build_release":
				// built-in repositories (https://duckdb.org/docs/stable/extensions/installing_extensions), no action needed

			default:
				// If the repository is not one of the built-in ones, we assume it's a custom repository, accessed as a
				// URL or a local file path. We need to ensure it is properly quoted.
				repo = strings.TrimPrefix(repo, "'")
				repo = strings.TrimSuffix(repo, "'")
				repo = "'" + repo + "'"
			}

			_, err := execer.ExecContext(ctx, fmt.Sprintf("INSTALL %s FROM %s", name, repo), nil)
			if err != nil {
				logger.Error("main: error installing extension", "name", name, "repository", repo, "error", err, "load-extensions", *extensionsStr)
				return fmt.Errorf("failed to install extension %s from %s: %w", name, repo, err)
			}

			_, err = execer.ExecContext(ctx, fmt.Sprintf("LOAD %s", name), nil)
			if err != nil {
				logger.Error("main: error loading extension", "name", name, "repository", repo, "error", err, "load-extensions", *extensionsStr)
				return fmt.Errorf("failed to load extension %s: %w", name, err)
			}
		}

		return nil
	}
}
