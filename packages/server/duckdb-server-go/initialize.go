package main

import (
	"context"
	"database/sql/driver"
	"fmt"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

// initializeDatabase is the CLI's trusted initialization. Extensions named by --load-extensions are installed first so
// a locally provided Gatekeeper artifact wins over the community install; the community install only runs when LOAD
// finds nothing.
func initializeDatabase(ctx context.Context, execer driver.ExecerContext, extensionList string, validation bool, allowed, blocked []string) error {
	if err := extensions.ParseAndInstall(ctx, execer, extensionList); err != nil {
		return err
	}
	if !validation {
		return nil
	}
	if err := extensions.LoadInstalled(ctx, execer, "gatekeeper"); err != nil {
		if err := extensions.InstallAndLoad(ctx, execer, "gatekeeper", "community"); err != nil {
			return err
		}
	}
	_, err := execer.ExecContext(ctx, `CALL system.main.gatekeeper_configure(
		allowed_functions := $1::VARCHAR[], blocked_functions := $2::VARCHAR[])`, []driver.NamedValue{
		{Ordinal: 1, Value: query.NormalizeFunctionNames(allowed)},
		{Ordinal: 2, Value: query.NormalizeFunctionNames(blocked)},
	})
	if err != nil {
		return fmt.Errorf("configure Gatekeeper: %w", err)
	}
	_, err = execer.ExecContext(ctx, `SET autoload_known_extensions = false;
		SET autoinstall_known_extensions = false; SET lock_configuration = true`, nil)
	return err
}
