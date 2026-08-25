package connector

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

func TestCompatSecurityProfilePreservesDefaults(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "data.parquet")
	createParquetFixture(t, path)
	db := openDB(t, Config{DSN: ":memory:"})

	var externalAccess, configurationLocked bool
	require.NoError(t, db.QueryRowContext(
		t.Context(),
		"SELECT current_setting('enable_external_access')::BOOLEAN, current_setting('lock_configuration')::BOOLEAN",
	).Scan(&externalAccess, &configurationLocked))
	assert.True(t, externalAccess)
	assert.False(t, configurationLocked)

	var answer int
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT answer FROM "+quoteSQL(path)).Scan(&answer))
	assert.Equal(t, 42, answer)
	output := filepath.Join(directory, "output.csv")
	_, err := db.ExecContext(t.Context(), "COPY (SELECT 1) TO "+quoteSQL(output))
	require.NoError(t, err)
	assert.FileExists(t, output)
	attached := filepath.Join(directory, "attached.duckdb")
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(attached)+" AS attached")
	require.NoError(t, err)
	assert.FileExists(t, attached)
}

func TestCatalogOnlySecurityProfile(t *testing.T) {
	db := openDB(t, Config{DSN: ":memory:", Policy: CatalogOnly()})

	assertLockedProfileSettings(t, db)
	assertListSettingLength(t, db, "allowed_directories", 0)
	assertListSettingLength(t, db, "allowed_paths", 0)

	var err error
	for _, statement := range []string{
		"SET allowed_configs = ['threads']",
		"SET allowed_directories = ['.']",
		"SET allowed_paths = ['data.parquet']",
		"SET allow_community_extensions = true",
		"SET allow_extensions_metadata_mismatch = true",
		"SET allow_persistent_secrets = true",
		"SET allow_unredacted_secrets = true",
		"SET allow_unsigned_extensions = true",
		"SET autoinstall_known_extensions = true",
		"SET autoload_known_extensions = true",
		"SET enable_external_file_cache = true",
		"SET enable_external_access = true",
		"SET lock_configuration = true",
		"SET temp_directory = '.tmp'",
	} {
		_, err = db.ExecContext(t.Context(), statement)
		require.ErrorContains(t, err, "configuration has been locked", statement)
	}

	_, err = db.ExecContext(t.Context(), "LOAD httpfs")
	require.Error(t, err)
	_, err = db.ExecContext(t.Context(), "INSTALL httpfs")
	require.Error(t, err)

	path := filepath.Join(t.TempDir(), "outside.parquet")
	createParquetFixture(t, path)
	assertQueryError(t, db, t.Context(), "SELECT count(*) FROM read_parquet("+quoteSQL(path)+")")

	outsideCSV := filepath.Join(t.TempDir(), "outside.csv")
	_, err = db.ExecContext(t.Context(), "COPY (SELECT 1) TO "+quoteSQL(outsideCSV))
	require.Error(t, err)
	assert.NoFileExists(t, outsideCSV)

	outsideDatabase := filepath.Join(t.TempDir(), "outside.duckdb")
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(outsideDatabase))
	require.Error(t, err)
	assert.NoFileExists(t, outsideDatabase)
}

func TestCatalogOnlyProfileInitializesDistinctConnectors(t *testing.T) {
	policy := CatalogOnly()

	for range 2 {
		duckdbConnector, err := Open(t.Context(), Config{DSN: ":memory:", Policy: policy})
		require.NoError(t, err)
		db := sql.OpenDB(duckdbConnector)
		require.NoError(t, db.PingContext(t.Context()))
		assertLockedProfileSettings(t, db)
		assertQueryError(t, db, t.Context(), "SELECT count(*) FROM read_text('/etc/hosts')")
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	}
}

func TestCatalogOnlyBootstrapsExtensionBeforeLock(t *testing.T) {
	var bootstrapCalls atomic.Int64
	duckdbConnector, err := Open(t.Context(), Config{
		DSN:    ":memory:",
		Policy: CatalogOnly(),
		Bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			bootstrapCalls.Add(1)
			return extensions.LoadInstalled(ctx, execer, "autocomplete")
		},
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), bootstrapCalls.Load())

	db := sql.OpenDB(duckdbConnector)
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	})
	var suggestions int
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT count(*) FROM sql_auto_complete('SELECT ')").Scan(&suggestions))
	assert.Positive(t, suggestions)
	assertLockedProfileSettings(t, db)
	_, err = db.ExecContext(t.Context(), "LOAD httpfs")
	require.Error(t, err)
	assert.Equal(t, int64(1), bootstrapCalls.Load())
}

func TestInitializeConnectionRunsAfterLock(t *testing.T) {
	ctx, cancel := context.WithCancel(t.Context())
	var initializeCalls atomic.Int64
	duckdbConnector, err := Open(ctx, Config{
		DSN:    ":memory:",
		Policy: CatalogOnly(),
		InitializeConnection: func(ctx context.Context, execer driver.ExecerContext) error {
			initializeCalls.Add(1)
			if err := ctx.Err(); err != nil {
				return err
			}
			if _, err := execer.ExecContext(ctx, "SET threads = 1", nil); err == nil || !strings.Contains(err.Error(), "locked") {
				return fmt.Errorf("expected locked configuration error, got %v", err)
			}
			return nil
		},
	})
	require.NoError(t, err)
	assert.Equal(t, int64(1), initializeCalls.Load())
	cancel()

	db := sql.OpenDB(duckdbConnector)
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	})
	require.NoError(t, db.PingContext(t.Context()))
	assert.Equal(t, int64(2), initializeCalls.Load())
}

func TestOpenReturnsBootstrapFailure(t *testing.T) {
	sentinel := fmt.Errorf("bootstrap failed")
	duckdbConnector, err := Open(t.Context(), Config{
		DSN: ":memory:",
		Bootstrap: func(context.Context, driver.ExecerContext) error {
			return sentinel
		},
	})
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, sentinel)
}

func TestCatalogOnlyProfilePersistsPrimaryDatabase(t *testing.T) {
	databasePath := filepath.Join(t.TempDir(), "catalog.duckdb")
	policy := CatalogOnly()
	duckdbConnector, err := Open(t.Context(), Config{DSN: databasePath, Policy: policy})
	require.NoError(t, err)
	db := sql.OpenDB(duckdbConnector)
	require.NoError(t, db.PingContext(t.Context()))
	_, err = db.ExecContext(t.Context(), "CREATE TABLE items AS SELECT 42 AS answer")
	require.NoError(t, err)
	require.NoError(t, db.Close())
	require.NoError(t, duckdbConnector.Close())

	duckdbConnector, err = Open(t.Context(), Config{DSN: databasePath, Policy: policy})
	require.NoError(t, err)
	db = sql.OpenDB(duckdbConnector)
	require.NoError(t, db.PingContext(t.Context()))
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	})
	var answer int
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT answer FROM items").Scan(&answer))
	assert.Equal(t, 42, answer)
}

func TestLocalFilesSecurityProfile(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "allowed.parquet")
	createParquetFixture(t, path)

	db := openDB(t, Config{
		DSN: ":memory:",
		Policy: LocalFiles(LocalFilesOptions{
			AllowedDirectories: []string{directory},
		}),
	})
	assertLockedProfileSettings(t, db)
	assertListSettingLength(t, db, "allowed_directories", 1)
	assertListSettingLength(t, db, "allowed_paths", 0)
	canonicalPath := filepath.Join(directory, "allowed.parquet")

	var answer int
	require.NoError(t, db.QueryRowContext(
		t.Context(),
		"SELECT answer FROM read_parquet("+quoteSQL(canonicalPath)+")",
	).Scan(&answer))
	assert.Equal(t, 42, answer)

	output := filepath.Join(directory, "output.csv")
	_, err := db.ExecContext(t.Context(), "COPY (SELECT 7 AS value) TO "+quoteSQL(output))
	require.NoError(t, err)
	assert.FileExists(t, output)

	attached := filepath.Join(directory, "attached.duckdb")
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(attached)+" AS attached")
	require.NoError(t, err)
	_, err = db.ExecContext(t.Context(), "DETACH attached")
	require.NoError(t, err)
	assert.FileExists(t, attached)

	require.NoError(t, db.QueryRowContext(
		t.Context(),
		"SELECT answer FROM "+quoteSQL(canonicalPath),
	).Scan(&answer))
	assert.Equal(t, 42, answer)

	outside := filepath.Join(t.TempDir(), "outside.parquet")
	createParquetFixture(t, outside)
	assertQueryError(t, db, t.Context(), "SELECT count(*) FROM read_parquet("+quoteSQL(outside)+")")
	outsideCSV := filepath.Join(filepath.Dir(outside), "outside.csv")
	_, err = db.ExecContext(t.Context(), "COPY (SELECT 1) TO "+quoteSQL(outsideCSV))
	require.Error(t, err)
	assert.NoFileExists(t, outsideCSV)
	outsideDatabase := filepath.Join(filepath.Dir(outside), "outside.duckdb")
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(outsideDatabase))
	require.Error(t, err)
	assert.NoFileExists(t, outsideDatabase)
}

func TestLocalFilesProfileAllowsOnlyExactPath(t *testing.T) {
	directory := t.TempDir()
	allowed := filepath.Join(directory, "allowed.parquet")
	createParquetFixture(t, allowed)
	outside := filepath.Join(directory, "outside.parquet")
	createParquetFixture(t, outside)

	db := openDB(t, Config{
		DSN: ":memory:",
		Policy: LocalFiles(LocalFilesOptions{
			AllowedPaths: []string{allowed},
		}),
	})
	assertLockedProfileSettings(t, db)
	assertListSettingLength(t, db, "allowed_directories", 0)
	assertListSettingLength(t, db, "allowed_paths", 1)

	var answer int
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT answer FROM "+quoteSQL(allowed)).Scan(&answer))
	assert.Equal(t, 42, answer)
	assertQueryError(t, db, t.Context(), "SELECT count(*) FROM "+quoteSQL(outside))
}

func TestLocalFilesProfileRejectsSymlinkEscapes(t *testing.T) {
	allowedDirectory := t.TempDir()
	outsideDirectory := t.TempDir()
	outside := filepath.Join(outsideDirectory, "outside.parquet")
	createParquetFixture(t, outside)
	symlink := filepath.Join(allowedDirectory, "escape.parquet")
	require.NoError(t, os.Symlink(outside, symlink))
	inside := filepath.Join(allowedDirectory, "inside.parquet")
	createParquetFixture(t, inside)
	insideLink := filepath.Join(allowedDirectory, "inside-link.parquet")
	require.NoError(t, os.Symlink(inside, insideLink))

	db := openDB(t, Config{
		DSN: ":memory:",
		Policy: LocalFiles(LocalFilesOptions{
			AllowedDirectories: []string{allowedDirectory},
		}),
	})
	var answer int
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT answer FROM "+quoteSQL(insideLink)).Scan(&answer))
	assert.Equal(t, 42, answer)

	assertQueryError(t, db, t.Context(), "SELECT count(*) FROM read_parquet("+quoteSQL(symlink)+")")
	assertQueryError(t, db, t.Context(), "SELECT count(*) FROM "+quoteSQL(symlink))

	outsideOutput := filepath.Join(outsideDirectory, "outside.csv")
	require.NoError(t, os.WriteFile(outsideOutput, []byte("sentinel"), 0o600))
	outputLink := filepath.Join(allowedDirectory, "escape.csv")
	require.NoError(t, os.Symlink(outsideOutput, outputLink))
	_, err := db.ExecContext(t.Context(), "COPY (SELECT 1) TO "+quoteSQL(outputLink))
	require.Error(t, err)
	content, readErr := os.ReadFile(outsideOutput)
	require.NoError(t, readErr)
	assert.Equal(t, "sentinel", string(content))

	outsideDatabase := filepath.Join(outsideDirectory, "outside.duckdb")
	createDatabaseFixture(t, outsideDatabase)
	databaseLink := filepath.Join(allowedDirectory, "escape.duckdb")
	require.NoError(t, os.Symlink(outsideDatabase, databaseLink))
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(databaseLink)+" AS escaped")
	require.Error(t, err)
}

func TestLocalFilesProfileComposesWithFunctionAllowlist(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "allowed.parquet")
	createParquetFixture(t, path)
	duckdbConnector, err := Open(t.Context(), Config{
		DSN: ":memory:",
		Policy: LocalFiles(LocalFilesOptions{
			AllowedDirectories: []string{directory},
		}),
	})
	require.NoError(t, err)
	db, err := query.New(t.Context(), duckdbConnector, query.WithFunctionAllowlist(query.FunctionAllowlistOptions{
		Include: []string{"read_parquet"},
	}))
	require.NoError(t, err)
	t.Cleanup(func() {
		db.Close()
		require.NoError(t, duckdbConnector.Close())
	})

	result, _, err := db.QueryJSON(
		t.Context(),
		"SELECT answer FROM read_parquet("+quoteSQL(path)+")",
		nil,
		false,
	)
	require.NoError(t, err)
	assert.JSONEq(t, `[{"answer":42}]`, string(result))
	arrowResult, _, err := db.QueryArrow(
		t.Context(),
		"SELECT answer FROM read_parquet("+quoteSQL(path)+")",
		nil,
		false,
	)
	require.NoError(t, err)
	assert.NotEmpty(t, arrowResult)
}

func TestLocalFilesProfileInitializesConcurrentConnections(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "allowed.parquet")
	createParquetFixture(t, path)
	duckdbConnector, err := Open(t.Context(), Config{
		DSN: ":memory:",
		Policy: LocalFiles(LocalFilesOptions{
			AllowedDirectories: []string{directory},
		}),
	})
	require.NoError(t, err)
	db := sql.OpenDB(duckdbConnector)
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	})
	db.SetMaxOpenConns(8)
	db.SetMaxIdleConns(8)

	const count = 8
	errs := make(chan error, count)
	ready := make(chan struct{}, count)
	release := make(chan struct{})
	start := make(chan struct{})
	var wait sync.WaitGroup
	for range count {
		wait.Add(1)
		go func() {
			defer wait.Done()
			<-start
			conn, err := db.Conn(t.Context())
			if err != nil {
				ready <- struct{}{}
				errs <- err
				return
			}
			var externalAccess bool
			err = conn.QueryRowContext(
				t.Context(),
				"SELECT value::BOOLEAN FROM duckdb_settings() WHERE name = 'enable_external_access'",
			).Scan(&externalAccess)
			if err == nil && externalAccess {
				err = assert.AnError
			}
			if err == nil {
				var answer int
				err = conn.QueryRowContext(t.Context(), "SELECT answer FROM "+quoteSQL(path)).Scan(&answer)
				if err == nil && answer != 42 {
					err = assert.AnError
				}
			}
			ready <- struct{}{}
			<-release
			if closeErr := conn.Close(); err == nil {
				err = closeErr
			}
			errs <- err
		}()
	}
	close(start)
	for range count {
		<-ready
	}
	assert.Equal(t, count, db.Stats().OpenConnections)
	close(release)
	wait.Wait()
	close(errs)
	connectionErrs := make([]error, 0, count)
	for err := range errs {
		connectionErrs = append(connectionErrs, err)
	}
	for _, err := range connectionErrs {
		require.NoError(t, err)
	}
}

func TestLockedProfilesRejectCommonExternalSchemes(t *testing.T) {
	var requests atomic.Int64
	listener, err := net.Listen("tcp4", "127.0.0.1:0")
	require.NoError(t, err)
	trap := &countingListener{Listener: listener}
	server := &httptest.Server{
		Listener: trap,
		Config: &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			requests.Add(1)
			w.WriteHeader(http.StatusNoContent)
		})},
	}
	server.Start()
	t.Cleanup(server.Close)

	db := openDB(t, Config{DSN: ":memory:", Policy: CatalogOnly()})

	host := strings.TrimPrefix(server.URL, "http://")
	paths := map[string]string{
		"http":  server.URL + "/object",
		"https": "https://" + host + "/object",
		"s3":    "s3://bucket/object",
		"s3a":   "s3a://bucket/object",
		"s3n":   "s3n://bucket/object",
		"gcs":   "gcs://bucket/object",
		"gs":    "gs://bucket/object",
		"r2":    "r2://bucket/object",
		"hf":    "hf://datasets/owner/repository/object",
		"azure": "azure://container/object",
		"az":    "az://container/object",
		"abfss": "abfss://container@account.dfs.core.windows.net/object",
		"file":  "file:///etc/hosts",
	}
	for name, path := range paths {
		t.Run(name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(t.Context(), 2*time.Second)
			defer cancel()
			assertQueryError(t, db, ctx, "SELECT count(*) FROM read_blob("+quoteSQL(path)+")")
			assertQueryError(t, db, ctx, "SELECT count(*) FROM "+quoteSQL(path+".parquet"))
		})
	}
	_, err = db.ExecContext(t.Context(), "COPY (SELECT 1) TO "+quoteSQL(server.URL+"/output.csv"))
	require.Error(t, err)
	_, err = db.ExecContext(t.Context(), "ATTACH "+quoteSQL(server.URL+"/database.duckdb"))
	require.Error(t, err)
	assert.Zero(t, trap.accepts.Load())
	assert.Zero(t, requests.Load())
}

func assertLockedProfileSettings(t *testing.T, db *sql.DB) {
	t.Helper()
	settings := map[string]string{
		"allow_community_extensions":         "false",
		"allow_extensions_metadata_mismatch": "false",
		"allow_persistent_secrets":           "false",
		"allow_unredacted_secrets":           "false",
		"allow_unsigned_extensions":          "false",
		"autoinstall_known_extensions":       "false",
		"autoload_known_extensions":          "false",
		"enable_external_file_cache":         "false",
		"enable_external_access":             "false",
		"lock_configuration":                 "true",
	}
	for name, want := range settings {
		var got string
		require.NoError(t, db.QueryRowContext(
			t.Context(),
			"SELECT value FROM duckdb_settings() WHERE name = "+quoteSQL(name),
		).Scan(&got))
		assert.Equal(t, want, got, name)
	}
	assertListSettingLength(t, db, "allowed_configs", 0)
	var tempDirectory string
	require.NoError(t, db.QueryRowContext(t.Context(), "SELECT current_setting('temp_directory')").Scan(&tempDirectory))
	assert.Empty(t, tempDirectory)
}

func assertListSettingLength(t *testing.T, db *sql.DB, name string, want int) {
	t.Helper()
	var count int
	require.NoError(t, db.QueryRowContext(
		t.Context(),
		"SELECT len(value::VARCHAR[]) FROM duckdb_settings() WHERE name = "+quoteSQL(name),
	).Scan(&count))
	assert.Equal(t, want, count, name)
}

func assertQueryError(t *testing.T, db *sql.DB, ctx context.Context, query string) {
	t.Helper()
	var count int
	require.Error(t, db.QueryRowContext(ctx, query).Scan(&count))
}

func openDB(t *testing.T, config Config) *sql.DB {
	t.Helper()
	duckdbConnector, err := Open(t.Context(), config)
	require.NoError(t, err)
	db := sql.OpenDB(duckdbConnector)
	require.NoError(t, db.PingContext(t.Context()))
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, duckdbConnector.Close())
	})
	return db
}

func createParquetFixture(t *testing.T, path string) {
	t.Helper()
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)
	db := sql.OpenDB(connector)
	t.Cleanup(func() {
		require.NoError(t, db.Close())
		require.NoError(t, connector.Close())
	})
	_, err = db.ExecContext(t.Context(), "COPY (SELECT 42 AS answer) TO "+quoteSQL(path)+" (FORMAT PARQUET)")
	require.NoError(t, err)
}

func createDatabaseFixture(t *testing.T, path string) {
	t.Helper()
	connector, err := duckdb.NewConnector(path, nil)
	require.NoError(t, err)
	db := sql.OpenDB(connector)
	require.NoError(t, db.PingContext(t.Context()))
	require.NoError(t, db.Close())
	require.NoError(t, connector.Close())
}

type countingListener struct {
	net.Listener
	accepts atomic.Int64
}

func (l *countingListener) Accept() (net.Conn, error) {
	conn, err := l.Listener.Accept()
	if err == nil {
		l.accepts.Add(1)
	}
	return conn, err
}

func quoteSQL(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}
