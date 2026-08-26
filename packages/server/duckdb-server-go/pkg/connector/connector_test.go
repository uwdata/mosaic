package connector

import (
	"context"
	"database/sql/driver"
	"errors"
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

	cfg, err := applyOptions([]Option{
		directoryOption,
		pathOption,
		WithAllowedDirectories("other"),
		WithAllowedPaths("other.parquet"),
	})
	require.NoError(t, err)
	assert.True(t, cfg.restrictExternalAccess)
	assert.Equal(t, []string{"relative", `\\server\share`, "gcs://bucket/data", "other"}, cfg.allowedDirectories)
	assert.Equal(t, []string{"missing.parquet", "other.parquet"}, cfg.allowedPaths)
}

func TestCatalogOnlyOption(t *testing.T) {
	cfg, err := applyOptions([]Option{WithCatalogOnly()})
	require.NoError(t, err)
	assert.True(t, cfg.restrictExternalAccess)
	assert.Empty(t, cfg.allowedDirectories)
	assert.Empty(t, cfg.allowedPaths)
}

func TestInitializeBootstrapOrder(t *testing.T) {
	execer := newRecordingExecer()
	require.NoError(t, initializeBootstrap(
		t.Context(),
		execer,
		func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
			return err
		},
		true,
		[]string{"/srv/O'Brien"},
		[]string{"/srv/data.parquet"},
	))
	require.Equal(t, []string{
		"BOOTSTRAP",
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

func TestInitializeBootstrapReturnsFinalizationFailure(t *testing.T) {
	sentinel := errors.New("unavailable")
	execer := newRecordingExecer()
	execer.failAt = 11
	execer.failErr = sentinel

	err := initializeBootstrap(
		t.Context(),
		execer,
		func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
			return err
		},
		true,
		nil,
		nil,
	)
	require.ErrorIs(t, err, sentinel)
	require.ErrorContains(t, err, "failed to set lock_configuration")
	assert.Len(t, execer.snapshot(), 12)
}

func TestInitializeBootstrapValidatesExecer(t *testing.T) {
	var nilExecer driver.ExecerContext
	require.EqualError(t, initializeBootstrap(t.Context(), nilExecer, nil, false, nil, nil), "nil execer")
}

func TestOpenRejectsNilContext(t *testing.T) {
	var ctx context.Context
	duckdbConnector, err := Open(ctx, ":memory:")
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, ErrInvalidConfig)
	require.EqualError(t, err, "connector: invalid configuration: nil context")
}

func TestOpenRejectsNilOption(t *testing.T) {
	duckdbConnector, err := Open(t.Context(), ":memory:", nil)
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, ErrInvalidConfig)
	require.EqualError(t, err, "connector: invalid configuration: option 0 must not be nil")
}

type recordingExecer struct {
	mu      sync.Mutex
	queries []string
	failAt  int
	failErr error
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

func (e *recordingExecer) snapshot() []string {
	e.mu.Lock()
	defer e.mu.Unlock()
	return append([]string(nil), e.queries...)
}
