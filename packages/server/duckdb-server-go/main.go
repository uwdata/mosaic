package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/marcboeker/go-duckdb/v2"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/query"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/server"
)

func main() {
	dbPath := flag.String("database", ":memory:", "Path of database file (e.g., \"database.db\". \":memory:\" for in-memory database)")
	address := flag.String("address", "localhost", "HTTP Address")
	port := flag.String("port", "3000", "HTTP Port")
	poolSize := flag.Int("connection-pool-size", 10, "Max connection pool size")
	cacheSize := flag.Int("cache-size", 1000, "Max number of cache entries")
	certFile := flag.String("cert", "", "Path to TLS certificate file (optional, enables HTTPS)")
	keyFile := flag.String("key", "", "Path to TLS private key file (optional, enables HTTPS)")
	schemaMatchHeadersStr := flag.String("schema-match-headers", "", "Comma-separated list of headers to match against schema names for multi-tenant access control (e.g., \"X-Tenant-Id,verified-user-id\")")
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
	connector, err := duckdb.NewConnector(*dbPath, nil)
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

	db, err := query.New(ctx, connector, *poolSize, *cacheSize, logger)
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
		"cache_size":           *cacheSize,
		"cert_file":            *certFile,
		"key_file":             *keyFile,
		"schema_match_headers": *schemaMatchHeadersStr,
	}
	logger.Info("DuckDB Server configuration", "config", config)

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
