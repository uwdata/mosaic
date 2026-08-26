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

func TestResolveExternalAccessPolicy(t *testing.T) {
	assert.Nil(t, resolveExternalAccessPolicy(nil))
	assert.NotNil(t, resolveExternalAccessPolicy(CatalogOnly()))
}

func TestLocalFilesCopiesPaths(t *testing.T) {
	directories := []string{"relative", `\\server\share`, "gcs://bucket/data"}
	paths := []string{"missing.parquet"}
	policy := LocalFiles(LocalFilesOptions{
		AllowedDirectories: directories,
		AllowedPaths:       paths,
	})
	directories[0] = "mutated"
	paths[0] = "mutated"

	resolved := resolveExternalAccessPolicy(policy)
	assert.Equal(t, []string{"relative", `\\server\share`, "gcs://bucket/data"}, resolved.allowedDirectories)
	assert.Equal(t, []string{"missing.parquet"}, resolved.allowedPaths)
}

func TestStartupInitializerOrder(t *testing.T) {
	execer := newRecordingExecer()
	startup := startupInitializer{
		ctx: t.Context(),
		bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
			return err
		},
		externalAccess: &resolvedExternalAccessPolicy{
			allowedDirectories: []string{"/srv/O'Brien"},
			allowedPaths:       []string{"/srv/data.parquet"},
		},
	}

	require.NoError(t, startup.initialize(execer))
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

	require.NoError(t, startup.initialize(execer))
	assert.Len(t, execer.snapshot(), 12)
}

func TestStartupInitializerCachesFailure(t *testing.T) {
	sentinel := errors.New("unavailable")
	execer := newRecordingExecer()
	execer.failAt = 11
	execer.failErr = sentinel
	startup := startupInitializer{
		ctx: t.Context(),
		bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
			return err
		},
		externalAccess: &resolvedExternalAccessPolicy{},
	}

	err := startup.initialize(execer)
	require.ErrorIs(t, err, sentinel)
	require.ErrorContains(t, err, "failed to set lock_configuration")
	err = startup.initialize(newRecordingExecer())
	require.ErrorIs(t, err, sentinel)
	assert.Len(t, execer.snapshot(), 12)
}

func TestStartupInitializerIsConcurrent(t *testing.T) {
	startup := startupInitializer{ctx: t.Context(), externalAccess: &resolvedExternalAccessPolicy{}}
	execer := newRecordingExecer()

	const count = 32
	errs := make(chan error, count)
	var wait sync.WaitGroup
	for range count {
		wait.Add(1)
		go func() {
			defer wait.Done()
			errs <- startup.initialize(execer)
		}()
	}
	wait.Wait()
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
	assert.Len(t, execer.snapshot(), 11)
}

func TestStartupInitializerValidatesExecer(t *testing.T) {
	startup := startupInitializer{ctx: t.Context()}
	var nilExecer driver.ExecerContext
	require.EqualError(t, startup.initialize(nilExecer), "nil execer")
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
