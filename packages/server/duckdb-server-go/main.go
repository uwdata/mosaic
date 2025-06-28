package main

import (
	"context"
	"flag"
	"log/slog"
	"net/http"
	"os"

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
	flag.Parse()

	ctx := context.Background()

	logLevel := slog.LevelDebug
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))

	// Create DuckDB connector for Arrow support
	connector, err := duckdb.NewConnector(*dbPath, nil)
	if err != nil {
		logger.Error("main: error creating duckdb connector", "error", err)
		return
	}
	defer func() {
		err = connector.Close()
		if err != nil {
			logger.Error("main: error closing duckdb connector: %v", err)
		}
	}()

	db, err := query.New(ctx, connector, *poolSize, *cacheSize, logger)
	if err != nil {
		logger.Error("main: error creating query DB", "error", err)
		return
	}

	s := server.New(db, logger)

	config := map[string]interface{}{
		"database":             *dbPath,
		"address":              *address,
		"port":                 *port,
		"connection_pool_size": *poolSize,
		"cache_size":           *cacheSize,
	}
	logger.Info("DuckDB Server configuration", "config", config)

	addr := *address + ":" + *port
	logger.Info("DuckDB Server listening on http://%s and ws://%s.", addr, addr)

	err = http.ListenAndServe(addr, s)
	if err != nil {
		logger.Error("main: error running HTTP server", "error", err)
		return
	}
}
