package main

import (
	"database/sql/driver"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func TestInitializeDatabase(t *testing.T) {
	for _, validation := range []bool{false, true} {
		t.Run(map[bool]string{false: "unrestricted", true: "validated"}[validation], func(t *testing.T) {
			connector := newConnector(t, ":memory:", "", validation, []string{" READ_CSV ", ""}, nil)
			opts := []query.OptionFunc{}
			if validation {
				opts = append(opts, query.WithValidation())
			}
			db, err := query.New(t.Context(), connector, opts...)
			require.NoError(t, err)
			t.Cleanup(db.Close)
			path := filepath.Join(t.TempDir(), "values.csv")
			require.NoError(t, os.WriteFile(path, []byte("value\n42\n"), 0o600))
			_, err = db.QueryArrow(t.Context(), "SELECT * FROM read_csv('"+path+"')", nil)
			require.NoError(t, err)
			conn, err := connector.Connect(t.Context())
			require.NoError(t, err)
			defer func() { require.NoError(t, conn.Close()) }()
			_, err = conn.(driver.ExecerContext).ExecContext(t.Context(), "CALL gatekeeper_configure()", nil)
			if validation {
				require.ErrorContains(t, err, "locked")
			} else {
				require.ErrorContains(t, err, "gatekeeper_configure does not exist")
			}
		})
	}
}

func TestInitializeDatabaseLocalArtifact(t *testing.T) {
	installed := newConnector(t, ":memory:", "", true, nil, nil)
	source, _ := scanValue(t, installed, "SELECT install_path FROM duckdb_extensions() WHERE extension_name = 'gatekeeper'").(string)
	artifact, err := os.ReadFile(source)
	require.NoError(t, err)
	require.Greater(t, len(artifact), 256)
	signed := filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension")
	require.NoError(t, os.WriteFile(signed, artifact, 0o600))
	clear(artifact[len(artifact)-256:])
	unsigned := filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension")
	require.NoError(t, os.WriteFile(unsigned, artifact, 0o600))

	t.Run("signed artifact replaces community install", func(t *testing.T) {
		connector := newConnector(t, freshDSN(t, ""), signed, true, nil, nil)
		db, err := query.New(t.Context(), connector, query.WithValidation())
		require.NoError(t, err)
		t.Cleanup(db.Close)
		require.NotEqual(t, "community", scanValue(t, connector, "SELECT installed_from FROM duckdb_extensions() WHERE extension_name = 'gatekeeper'"))
	})

	for _, tc := range []struct{ name, dsn, path, want string }{
		{"unsigned rejected", freshDSN(t, ""), unsigned, "signature"},
		{"missing artifact", freshDSN(t, ""), filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension"), "gatekeeper.duckdb_extension"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			connector := newConnector(t, tc.dsn, tc.path, true, nil, nil)
			db, err := query.New(t.Context(), connector, query.WithValidation())
			require.ErrorContains(t, err, tc.want)
			require.Nil(t, db)
		})
	}

	t.Run("unsigned artifact requires DSN opt-in", func(t *testing.T) {
		connector := newConnector(t, freshDSN(t, "allow_unsigned_extensions=true"), unsigned, true, nil, nil)
		db, err := query.New(t.Context(), connector, query.WithValidation())
		require.NoError(t, err)
		t.Cleanup(db.Close)
	})
}

func TestInitializeDatabaseCommunityInstall(t *testing.T) {
	if testing.Short() {
		t.Skip("downloads the community extension into a fresh extension directory")
	}
	connector := newConnector(t, freshDSN(t, ""), "", true, nil, nil)
	db, err := query.New(t.Context(), connector, query.WithValidation())
	require.NoError(t, err)
	t.Cleanup(db.Close)
	require.Equal(t, "community", scanValue(t, connector, "SELECT installed_from FROM duckdb_extensions() WHERE extension_name = 'gatekeeper'"))
	require.Equal(t, false, scanValue(t, connector, "SELECT current_setting('allow_unsigned_extensions')"))
}

// scanValue reads one value on a raw driver connection. sql.OpenDB(connector).Close() would close the connector too.
func scanValue(t *testing.T, connector *duckdb.Connector, stmt string) driver.Value {
	t.Helper()
	conn, err := connector.Connect(t.Context())
	require.NoError(t, err)
	defer func() { require.NoError(t, conn.Close()) }()
	rows, err := conn.(driver.QueryerContext).QueryContext(t.Context(), stmt, nil)
	require.NoError(t, err)
	defer func() { require.NoError(t, rows.Close()) }()
	values := make([]driver.Value, len(rows.Columns()))
	require.NoError(t, rows.Next(values))
	return values[0]
}

// newConnector runs initializeDatabase once, as main does, because the validated path locks configuration.
func newConnector(t *testing.T, dsn, extensionList string, validation bool, allowed, blocked []string) *duckdb.Connector {
	t.Helper()
	var once sync.Once
	var initErr error
	connector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		once.Do(func() {
			initErr = initializeDatabase(t.Context(), execer, extensionList, validation, allowed, blocked)
		})
		return initErr
	})
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	return connector
}

func freshDSN(t *testing.T, params string) string {
	t.Helper()
	dsn := ":memory:?extension_directory=" + url.QueryEscape(t.TempDir())
	if params != "" {
		dsn += "&" + params
	}
	return dsn
}
