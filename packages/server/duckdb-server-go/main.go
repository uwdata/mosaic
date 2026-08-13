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

	"github.com/duckdb/duckdb-go/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/server"
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
	extensionsStr := flag.String("load-extensions", "", "Comma-separated list of extensions to install and load at startup. Use a pipe after the extension name to specify a DuckDB repository alias. Unspecified repositories use DuckDB's default (e.g. mysql_scanner,netquack|community,aws|core_nightly).")
	functionBlocklistStr := flag.String("function-blocklist", "", "Comma-separated list of functions to block, useful for blocking functions that may pose security or performance risks. (e.g., 'bigquery_query,read_parquet')")
	var functionAllowlist optionalCommaListFlag
	flag.Var(&functionAllowlist, "function-allowlist", "Comma-separated list of functions to allow. Exact names are matched case-insensitively; an explicitly empty value rejects all functions.")
	flag.Parse()

	var schemaMatchHeaders []string
	if *schemaMatchHeadersStr != "" {
		schemaMatchHeaders = strings.Split(*schemaMatchHeadersStr, ",")
	}

	var functionBlocklist []string
	if *functionBlocklistStr != "" {
		functionBlocklist = strings.Split(*functionBlocklistStr, ",")
	}

	ctx := context.Background()

	logLevel := slog.LevelDebug
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	if err := extensions.Validate(*extensionsStr); err != nil {
		logger.Error("main: invalid load-extensions", "error", err, "load-extensions", *extensionsStr)
		return
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

	connector, err := duckdb.NewConnector(*dbPath, func(execer driver.ExecerContext) error {
		return extensions.ParseAndInstall(ctx, execer, *extensionsStr)
	})
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

	queryOptions := []query.OptionFunc{
		query.WithMaxConnections(*poolSize),
		query.WithMaxCacheEntries(*maxCacheEntries),
		query.WithMaxCacheBytes(*maxCacheBytes),
		query.WithTTL(ttl),
		query.WithLogger(logger),
		query.WithFunctionBlocklist(functionBlocklist),
	}
	if functionAllowlist.set {
		queryOptions = append(queryOptions, query.WithFunctionAllowlist(functionAllowlist.values))
	}

	db, err := query.New(ctx, connector, queryOptions...)
	if err != nil {
		logger.Error("main: error creating query DB", "error", err)
		return
	}
	defer db.Close()

	s, err := server.New(db,
		server.WithSchemaMatchHeaders(schemaMatchHeaders...),
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
		return
	}
	logger.Warn("DuckDB Server permits all HTTP and WebSocket origins for compatibility; enforce an outer origin or CSRF policy before exposing it to untrusted browsers")

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
		"function_blocklist":   *functionBlocklistStr,
		"function_allowlist":   functionAllowlist.String(),
		"allowlist_configured": functionAllowlist.set,
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
