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
	for _, tc := range []struct {
		name     string
		document *string
	}{
		{"unrestricted", nil},
		{"configured", policyDocument(`{"version":1,"options":{"blocked_functions":["md5"]}}`)},
	} {
		t.Run(tc.name, func(t *testing.T) {
			connector := newConnector(t, ":memory:", "", tc.document)
			var opts []query.OptionFunc
			if tc.document != nil {
				opts = append(opts, query.WithValidation())
			}
			db, err := query.New(t.Context(), connector, opts...)
			require.NoError(t, err)
			t.Cleanup(db.Close)
			_, err = db.Query(t.Context(), "SELECT 42", nil)
			require.NoError(t, err)
			_, err = db.Query(t.Context(), "SELECT md5('x')", nil)
			if tc.document == nil {
				require.NoError(t, err)
				require.NoError(t, db.Exec(t.Context(), "CREATE TABLE items (value INTEGER)"))
				require.Equal(t, false, scanValue(t, connector, "SELECT loaded FROM duckdb_extensions() WHERE extension_name='gatekeeper'"))
			} else {
				require.ErrorIs(t, err, query.ErrAccessDenied)
				require.ErrorIs(t, db.Exec(t.Context(), "SELECT 1"), query.ErrExecWithValidation)
				require.Equal(t, true, scanValue(t, connector, "SELECT current_setting('lock_configuration')"))
				for _, setting := range []string{"autoload_known_extensions", "autoinstall_known_extensions"} {
					require.Equal(t, false, scanValue(t, connector, "SELECT current_setting('"+setting+"')"))
				}
			}
		})
	}
}

func TestInitializeDatabaseLocalArtifact(t *testing.T) {
	installed := newConnector(t, ":memory:", "", defaultPolicy())
	source := scanValue(t, installed, "SELECT install_path FROM duckdb_extensions() WHERE extension_name='gatekeeper'").(string)
	artifact, err := os.ReadFile(source)
	require.NoError(t, err)
	path := filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension")
	require.NoError(t, os.WriteFile(path, artifact, 0o600))
	connector := newConnector(t, freshDSN(t), path, defaultPolicy())
	db, err := query.New(t.Context(), connector, query.WithValidation())
	require.NoError(t, err)
	t.Cleanup(db.Close)
	require.NotEqual(t, "community", scanValue(t, connector, "SELECT installed_from FROM duckdb_extensions() WHERE extension_name='gatekeeper'"))
}

func TestInitializeDatabaseFailsClosed(t *testing.T) {
	for _, tc := range []struct{ name, extension, document, want string }{
		{"missing artifact", filepath.Join(t.TempDir(), "gatekeeper.duckdb_extension"), `{"version":1,"options":{}}`, "gatekeeper.duckdb_extension"},
		{"invalid document", "", `{}`, "configure Gatekeeper"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var flag gatekeeperFlag
			require.NoError(t, flag.Set(tc.document))
			connector := newConnector(t, ":memory:", tc.extension, flag.document)
			db, err := query.New(t.Context(), connector, query.WithValidation())
			require.ErrorContains(t, err, tc.want)
			require.Nil(t, db)
		})
	}
}

func TestInitializeDatabaseCommunityInstall(t *testing.T) {
	if testing.Short() {
		t.Skip("downloads the community extension into a fresh extension directory")
	}
	connector := newConnector(t, freshDSN(t), "", defaultPolicy())
	db, err := query.New(t.Context(), connector, query.WithValidation())
	require.NoError(t, err)
	t.Cleanup(db.Close)
	require.Equal(t, "community", scanValue(t, connector, "SELECT installed_from FROM duckdb_extensions() WHERE extension_name='gatekeeper'"))
	t.Logf("community Gatekeeper version: %v", scanValue(t, connector, "SELECT extension_version FROM duckdb_extensions() WHERE extension_name='gatekeeper'"))
	require.Equal(t, false, scanValue(t, connector, "SELECT current_setting('allow_unsigned_extensions')"))
}

// sql.OpenDB(connector).Close() would close the shared connector too.
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

func newConnector(t *testing.T, dsn, extensionList string, policy *string) *duckdb.Connector {
	t.Helper()
	var once sync.Once
	var initErr error
	connector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		once.Do(func() { initErr = initializeDatabase(t.Context(), execer, extensionList, policy) })
		return initErr
	})
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, connector.Close()) })
	return connector
}

func policyDocument(value string) *string { return &value }
func defaultPolicy() *string              { return policyDocument(`{"version":1,"options":{}}`) }
func freshDSN(t *testing.T) string {
	t.Helper()
	return ":memory:?extension_directory=" + url.QueryEscape(t.TempDir())
}
