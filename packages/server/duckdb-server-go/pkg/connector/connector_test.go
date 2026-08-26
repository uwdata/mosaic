package connector

import (
	"context"
	"database/sql/driver"
	"errors"
	"io"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExternalAccessOptions(t *testing.T) {
	directories := []string{"relative", `\\server\share`, "gcs://bucket/data"}
	paths := []string{"missing.parquet"}
	directoryOption := WithAllowedDirectories(directories...)
	pathOption := WithAllowedPaths(paths...)
	directories[0] = "mutated"
	paths[0] = "mutated"

	cfg := applyOptions([]Option{
		directoryOption,
		pathOption,
		WithCatalogOnly(),
		WithAllowedDirectories("other"),
		WithAllowedPaths("other.parquet"),
	})
	assert.True(t, cfg.restrictExternalAccess)
	assert.Equal(t, []string{"relative", `\\server\share`, "gcs://bucket/data", "other"}, cfg.allowedDirectories)
	assert.Equal(t, []string{"missing.parquet", "other.parquet"}, cfg.allowedPaths)
}

func TestSettingOptions(t *testing.T) {
	cfg := applyOptions([]Option{
		WithSetting("http_timeout", "30"),
		WithSetting("WORKER_THREADS", "8"),
		WithSetting("MAX_MEMORY", "1GB"),
		WithMemoryLimit("2GB"),
		WithThreads(4),
		WithTempDirectory("/srv/spill"),
		WithMaxTempDirectorySize("8GB"),
		WithExternalFileCache(),
		WithParquetMetadataCache(),
	})
	assert.Equal(t, []duckDBSetting{
		{name: "http_timeout", value: "30"},
		{name: "WORKER_THREADS", value: "8"},
		{name: "MAX_MEMORY", value: "1GB"},
		{name: "memory_limit", value: "2GB"},
		{name: "threads", value: "4"},
		{name: "temp_directory", value: "/srv/spill"},
		{name: "max_temp_directory_size", value: "8GB"},
		{name: "enable_external_file_cache", value: "true"},
		{name: "parquet_metadata_cache", value: "true"},
	}, cfg.settings)
}

func TestAddDuckDBSettings(t *testing.T) {
	dsn := addDuckDBSettings(
		":memory:?threads=2",
		[]duckDBSetting{{name: "autoload_known_extensions", value: "false"}},
	)
	assert.Equal(
		t,
		":memory:?threads=2&autoload_known_extensions=false",
		dsn,
	)
}

func TestCatalogOnlyOption(t *testing.T) {
	cfg := applyOptions([]Option{WithCatalogOnly()})
	assert.True(t, cfg.restrictExternalAccess)
	assert.Empty(t, cfg.allowedDirectories)
	assert.Empty(t, cfg.allowedPaths)
}

func TestInitializeBootstrapOrder(t *testing.T) {
	execer := newRecordingExecer()
	execer.persistentSecrets = true
	require.NoError(t, initializeBootstrap(
		t.Context(),
		execer,
		config{
			bootstrapInitializer: func(ctx context.Context, execer driver.ExecerContext) error {
				_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
				return err
			},
			restrictExternalAccess: true,
			allowedDirectories:     []string{"/srv/O'Brien"},
			allowedPaths:           []string{"/srv/data.parquet"},
		},
	))
	require.Equal(t, []string{
		"BOOTSTRAP",
		"SELECT current_setting('allow_persistent_secrets')::BOOLEAN",
		"SET allow_persistent_secrets = false",
		"SET allow_extensions_metadata_mismatch = false",
		"SET allowed_configs = []",
		"SET autoinstall_known_extensions = false",
		"SET autoload_known_extensions = false",
		"SET enable_external_file_cache = false",
		"SET temp_directory = ''",
		"SET allowed_directories = ['/srv/O''Brien']",
		"SET allowed_paths = ['/srv/data.parquet']",
		"SET enable_external_access = false",
		"SET lock_configuration = true",
	}, execer.snapshot())
}

func TestInitializeBootstrapAppliesConfiguredSettingsBeforeLock(t *testing.T) {
	execer := newRecordingExecer()
	require.NoError(t, initializeBootstrap(
		t.Context(),
		execer,
		config{
			restrictExternalAccess: true,
			settings: []duckDBSetting{
				{name: "worker_threads", value: "1"},
				{name: "threads", value: "2"},
				{name: "http_timeout", value: "10'; ATTACH 'evil.db"},
			},
		},
	))
	queries := execer.snapshot()
	require.NotEmpty(t, queries)
	assert.Equal(t, `SET GLOBAL "worker_threads" = '1'`, queries[0])
	assert.Equal(t, `SET GLOBAL "threads" = '2'`, queries[1])
	assert.Equal(t, `SET GLOBAL "http_timeout" = '10''; ATTACH ''evil.db'`, queries[2])
	assert.Equal(t, "SELECT current_setting('allow_persistent_secrets')::BOOLEAN", queries[3])
	assert.Equal(t, "SET lock_configuration = true", queries[len(queries)-1])
}

func TestInitializeBootstrapReturnsFinalizationFailure(t *testing.T) {
	sentinel := errors.New("unavailable")
	execer := newRecordingExecer()
	execer.persistentSecrets = true
	execer.failAt = 12
	execer.failErr = sentinel

	err := initializeBootstrap(
		t.Context(),
		execer,
		config{
			bootstrapInitializer: func(ctx context.Context, execer driver.ExecerContext) error {
				_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
				return err
			},
			restrictExternalAccess: true,
		},
	)
	require.ErrorIs(t, err, sentinel)
	require.ErrorContains(t, err, "failed to set lock_configuration")
	assert.Len(t, execer.snapshot(), 13)
}

func TestInitializeBootstrapSkipsUnchangedPersistentSecrets(t *testing.T) {
	execer := newRecordingExecer()
	require.NoError(t, initializeBootstrap(
		t.Context(),
		execer,
		config{restrictExternalAccess: true},
	))
	assert.Contains(t, execer.snapshot(), "SELECT current_setting('allow_persistent_secrets')::BOOLEAN")
	assert.NotContains(t, execer.snapshot(), "SET allow_persistent_secrets = false")
}

func TestInitializeBootstrapValidatesExecer(t *testing.T) {
	var nilExecer driver.ExecerContext
	require.EqualError(t, initializeBootstrap(t.Context(), nilExecer, config{}), "nil execer")
}

func TestOpenRejectsNilContext(t *testing.T) {
	var ctx context.Context
	duckdbConnector, err := Open(ctx, ":memory:")
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, ErrInvalidConfig)
	require.EqualError(t, err, "connector: invalid configuration: nil context")
}

type recordingExecer struct {
	mu      sync.Mutex
	queries []string
	failAt  int
	failErr error

	persistentSecrets bool
}

func newRecordingExecer() *recordingExecer {
	return &recordingExecer{failAt: -1}
}

func (e *recordingExecer) ExecContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Result, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.queries = append(e.queries, query)
	if len(e.queries)-1 == e.failAt {
		return nil, e.failErr
	}
	return driver.RowsAffected(0), nil
}

func (e *recordingExecer) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.queries = append(e.queries, query)
	if len(e.queries)-1 == e.failAt {
		return nil, e.failErr
	}
	return &singleValueRows{value: e.persistentSecrets}, nil
}

func (e *recordingExecer) snapshot() []string {
	e.mu.Lock()
	defer e.mu.Unlock()
	return append([]string(nil), e.queries...)
}

type singleValueRows struct {
	value driver.Value
	read  bool
}

func (r *singleValueRows) Columns() []string {
	return []string{"value"}
}

func (r *singleValueRows) Close() error {
	return nil
}

func (r *singleValueRows) Next(dest []driver.Value) error {
	if r.read {
		return io.EOF
	}
	r.read = true
	dest[0] = r.value
	return nil
}
