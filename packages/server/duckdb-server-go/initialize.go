package main

import (
	"context"
	"database/sql/driver"
	"fmt"
	"strings"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
)

func initializeDatabase(ctx context.Context, execer driver.ExecerContext, extensionList, gatekeeper string, validation bool, allowed, blocked []string) error {
	if err := extensions.ParseAndInstall(ctx, execer, extensionList); err != nil {
		return err
	}
	if gatekeeper == "" {
		if err := extensions.InstallAndLoad(ctx, execer, "gatekeeper", "community"); err != nil {
			return err
		}
	} else if err := extensions.LoadInstalled(ctx, execer, gatekeeper); err != nil {
		return err
	}
	if !validation {
		return nil
	}
	normalize := func(names []string) []string {
		result := make([]string, 0, len(names))
		for _, name := range names {
			if name = strings.ToLower(strings.TrimSpace(name)); name != "" {
				result = append(result, name)
			}
		}
		return result
	}
	_, err := execer.ExecContext(ctx, `CALL system.main.gatekeeper_configure(
		allowed_functions := $1::VARCHAR[], blocked_functions := $2::VARCHAR[])`, []driver.NamedValue{
		{Ordinal: 1, Value: normalize(allowed)},
		{Ordinal: 2, Value: normalize(blocked)},
	})
	if err != nil {
		return fmt.Errorf("configure Gatekeeper: %w", err)
	}
	_, err = execer.ExecContext(ctx, `SET autoload_known_extensions = false;
		SET autoinstall_known_extensions = false; SET lock_configuration = true`, nil)
	return err
}
