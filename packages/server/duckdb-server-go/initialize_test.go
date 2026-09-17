package main

import (
	"database/sql/driver"
	"os"
	"path/filepath"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func TestInitializeDatabase(t *testing.T) {
	for _, validation := range []bool{false, true} {
		t.Run(map[bool]string{false: "unrestricted", true: "validated"}[validation], func(t *testing.T) {
			connector, err := duckdb.NewConnector(":memory:", nil)
			require.NoError(t, err)
			t.Cleanup(func() { require.NoError(t, connector.Close()) })
			conn, err := connector.Connect(t.Context())
			require.NoError(t, err)
			require.NoError(t, initializeDatabase(t.Context(), conn.(driver.ExecerContext), "", "", validation, []string{" READ_CSV ", ""}, nil))
			require.NoError(t, conn.Close())
			opts := []query.OptionFunc{query.WithGatekeeperExtension("gatekeeper")}
			if validation {
				opts = append(opts, query.WithFunctionAllowlist(query.FunctionAllowlistOptions{Include: []string{"read_csv"}}))
			}
			db, err := query.New(t.Context(), connector, opts...)
			require.NoError(t, err)
			t.Cleanup(db.Close)
			path := filepath.Join(t.TempDir(), "values.csv")
			require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))
			_, err = db.QueryArrow(t.Context(), "SELECT * FROM read_csv('"+path+"')", nil)
			require.NoError(t, err)
			conn, err = connector.Connect(t.Context())
			require.NoError(t, err)
			defer func() { require.NoError(t, conn.Close()) }()
			_, err = conn.(driver.ExecerContext).ExecContext(t.Context(), "CALL gatekeeper_configure()", nil)
			if validation {
				require.ErrorContains(t, err, "locked")
			} else {
				require.NoError(t, err)
			}
		})
	}
}
