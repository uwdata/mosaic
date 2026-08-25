package connector

import (
	"context"
	"database/sql/driver"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestResolveResourcePolicy(t *testing.T) {
	dsn, policy, err := resolveResourcePolicy(":memory:?threads=2", nil)
	require.NoError(t, err)
	assert.Equal(t, ":memory:?threads=2", dsn)
	assert.Nil(t, policy)

	dsn, policy, err = resolveResourcePolicy(":memory:?threads=2", CatalogOnly())
	require.NoError(t, err)
	assert.NotNil(t, policy)
	assertSecurityPolicyDSN(t, dsn)
}

func TestLocalFilesCopiesCanonicalizesAndDeduplicatesPaths(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "data.parquet")
	require.NoError(t, os.WriteFile(path, []byte("fixture"), 0o600))
	symlink := filepath.Join(t.TempDir(), "data")
	require.NoError(t, os.Symlink(directory, symlink))
	directories := []string{directory, symlink}
	paths := []string{path}
	policy := LocalFiles(LocalFilesOptions{
		AllowedDirectories: directories,
		AllowedPaths:       paths,
	})
	directories[0] = "mutated"
	paths[0] = "mutated"

	_, resolved, err := resolveResourcePolicy(":memory:", policy)
	require.NoError(t, err)
	canonicalDirectory, err := filepath.EvalSymlinks(directory)
	require.NoError(t, err)
	canonicalPath, err := filepath.EvalSymlinks(path)
	require.NoError(t, err)
	assert.Equal(t, []string{canonicalDirectory}, resolved.allowedDirectories)
	assert.Equal(t, []string{canonicalPath}, resolved.allowedPaths)
}

func TestResolveResourcePolicyRejectsInvalidFiles(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "data.parquet")
	require.NoError(t, os.WriteFile(path, []byte("fixture"), 0o600))

	tests := []struct {
		name    string
		options LocalFilesOptions
		wantErr string
	}{
		{name: "needs files", wantErr: "requires at least one"},
		{name: "remote directory", options: LocalFilesOptions{AllowedDirectories: []string{"gcs://bucket/data"}}, wantErr: "not a local filesystem path"},
		{name: "directory is file", options: LocalFilesOptions{AllowedDirectories: []string{path}}, wantErr: "is not a directory"},
		{name: "path is directory", options: LocalFilesOptions{AllowedPaths: []string{directory}}, wantErr: "is not a file"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := resolveResourcePolicy(":memory:", LocalFiles(tt.options))
			require.ErrorContains(t, err, tt.wantErr)
		})
	}
}

func TestResolveResourcePolicyRejectsOwnedDatabaseSettings(t *testing.T) {
	settings := []string{
		"allowed_directories",
		"allowed_paths",
		"enable_external_access",
		"lock_configuration",
		"temp_directory",
	}
	for _, setting := range strictPolicySettings {
		settings = append(settings, setting.name)
	}
	for _, setting := range settings {
		t.Run(setting, func(t *testing.T) {
			_, _, err := resolveResourcePolicy(
				":memory:?"+strings.ToUpper(setting)+"=true",
				CatalogOnly(),
			)
			require.ErrorContains(t, err, "is owned by the resource policy")
		})
	}
}

func TestResolveResourcePolicyRejectsRemoteDatabasePaths(t *testing.T) {
	for _, path := range []string{
		"http://host/database",
		"https://host/database",
		"s3://bucket/database",
		"s3a://bucket/database",
		"s3n://bucket/database",
		"gcs://bucket/database",
		"gs://bucket/database",
		"r2://bucket/database",
		"hf://datasets/owner/database",
		"azure://container/database",
		"az://container/database",
		"abfs://container@account.dfs.core.windows.net/database",
		"abfss://container@account.dfs.core.windows.net/database",
		"file:///tmp/database",
		"md:database",
		`\\server\share\database`,
		"//server/share/database",
	} {
		t.Run(path, func(t *testing.T) {
			_, _, err := resolveResourcePolicy(path, CatalogOnly())
			require.ErrorContains(t, err, "is not a local filesystem path")
		})
	}
}

func TestStartupInitializerOrder(t *testing.T) {
	execer := newRecordingExecer()
	startup := startupInitializer{
		ctx: t.Context(),
		bootstrap: func(ctx context.Context, execer driver.ExecerContext) error {
			_, err := execer.ExecContext(ctx, "BOOTSTRAP", nil)
			return err
		},
		policy: &resolvedResourcePolicy{
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
		policy: &resolvedResourcePolicy{},
	}

	err := startup.initialize(execer)
	require.ErrorIs(t, err, sentinel)
	require.ErrorContains(t, err, "failed to set lock_configuration")
	err = startup.initialize(newRecordingExecer())
	require.ErrorIs(t, err, sentinel)
	assert.Len(t, execer.snapshot(), 12)
}

func TestStartupInitializerIsConcurrent(t *testing.T) {
	startup := startupInitializer{ctx: t.Context(), policy: &resolvedResourcePolicy{}}
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
	require.EqualError(t, startup.initialize(nilExecer), "connector: nil execer")
}

func TestOpenRejectsNilContext(t *testing.T) {
	var ctx context.Context
	duckdbConnector, err := Open(ctx, Config{DSN: ":memory:"})
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, ErrInvalidConfig)
	require.EqualError(t, err, "connector: invalid configuration: nil context")
}

func TestOpenClassifiesInvalidPolicy(t *testing.T) {
	duckdbConnector, err := Open(t.Context(), Config{
		DSN:    ":memory:",
		Policy: LocalFiles(LocalFilesOptions{}),
	})
	require.Nil(t, duckdbConnector)
	require.ErrorIs(t, err, ErrInvalidConfig)
	require.EqualError(t, err, "connector: invalid configuration: local-files policy requires at least one allowed directory or path")
}

func assertSecurityPolicyDSN(t *testing.T, dsn string) {
	t.Helper()
	database, rawQuery, found := strings.Cut(dsn, "?")
	require.True(t, found)
	assert.Equal(t, ":memory:", database)
	query, err := url.ParseQuery(rawQuery)
	require.NoError(t, err)
	assert.Equal(t, "2", query.Get("threads"))
	for _, setting := range strictPolicySettings {
		assert.Equal(t, setting.value, query.Get(setting.name), setting.name)
	}
	assert.False(t, query.Has("enable_external_access"))
	assert.False(t, query.Has("lock_configuration"))
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
