package connector_test

import (
	"context"
	"database/sql/driver"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/connector"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
)

func ExampleOpen_unlockedExtensions() {
	ctx := context.Background()
	duckdbConnector, err := connector.Open(ctx, connector.Config{
		DSN: ":memory:",
		Bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			return extensions.ParseAndInstall(ctx, execer, "httpfs", "netquack|community")
		},
	})
	if err != nil {
		panic(err)
	}
	defer func() {
		if err := duckdbConnector.Close(); err != nil {
			panic(err)
		}
	}()
}

func ExampleOpen_lockedExtensions() {
	ctx := context.Background()
	duckdbConnector, err := connector.Open(ctx, connector.Config{
		DSN: ":memory:",
		Bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			return extensions.LoadInstalled(ctx, execer, "spatial")
		},
		Policy: connector.CatalogOnly(),
	})
	if err != nil {
		panic(err)
	}
	defer func() {
		if err := duckdbConnector.Close(); err != nil {
			panic(err)
		}
	}()
}
