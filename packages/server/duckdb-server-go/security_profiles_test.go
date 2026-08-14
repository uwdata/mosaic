package main

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

func TestResolveSecurityProfile(t *testing.T) {
	directory := t.TempDir()
	path := filepath.Join(directory, "data.parquet")
	require.NoError(t, os.WriteFile(path, []byte("fixture"), 0o600))

	tests := []struct {
		name       string
		profile    string
		extensions string
		dirs       []string
		paths      []string
		wantErr    string
	}{
		{name: "compat", profile: "compat"},
		{name: "profile names are normalized", profile: " LOCAL-FILES ", dirs: []string{directory}},
		{name: "catalog only", profile: "catalog-only"},
		{name: "local directory", profile: "local-files", dirs: []string{directory}},
		{name: "local path", profile: "local-files", paths: []string{path}},
		{name: "unknown", profile: "remote-files", wantErr: "unknown security profile"},
		{name: "blank", profile: " ", wantErr: "security profile is blank"},
		{name: "compat paths", profile: "compat", dirs: []string{directory}, wantErr: "require the local-files"},
		{name: "catalog paths", profile: "catalog-only", paths: []string{path}, wantErr: "catalog-only does not accept"},
		{name: "local needs paths", profile: "local-files", wantErr: "requires at least one"},
		{name: "locked extensions", profile: "catalog-only", extensions: "httpfs", wantErr: "load-extensions is incompatible"},
		{name: "remote directory", profile: "local-files", dirs: []string{"gcs://bucket/data"}, wantErr: "not a local filesystem path"},
		{name: "directory is file", profile: "local-files", dirs: []string{path}, wantErr: "is not a directory"},
		{name: "path is directory", profile: "local-files", paths: []string{directory}, wantErr: "is not a file"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := resolveSecurityProfile(tt.profile, ":memory:?threads=2", tt.extensions, tt.dirs, tt.paths)
			if tt.wantErr != "" {
				require.ErrorContains(t, err, tt.wantErr)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, securityProfile(strings.ToLower(strings.TrimSpace(tt.profile))), got.name)
			if got.name == securityProfileCompat {
				assert.Equal(t, ":memory:?threads=2", got.databaseDSN)
				assert.Nil(t, got.newConnectionInitializer())
			} else {
				assertSecurityProfileDSN(t, got.databaseDSN)
				assert.NotNil(t, got.newConnectionInitializer())
			}
		})
	}
}

func TestResolveSecurityProfileCanonicalizesAndDeduplicatesPaths(t *testing.T) {
	directory := t.TempDir()
	symlink := filepath.Join(t.TempDir(), "data")
	require.NoError(t, os.Symlink(directory, symlink))

	got, err := resolveSecurityProfile("local-files", ":memory:", "", []string{directory, symlink}, nil)
	require.NoError(t, err)
	canonical, err := filepath.EvalSymlinks(directory)
	require.NoError(t, err)
	require.Equal(t, []string{canonical}, got.allowedDirectories)
	assert.Equal(t, []string{canonical}, got.newConnectionInitializer().allowedDirectories)
}

func TestResolveSecurityProfileRejectsOwnedDatabaseSettings(t *testing.T) {
	settings := []string{
		"allowed_directories",
		"allowed_paths",
		"enable_external_access",
		"lock_configuration",
		"temp_directory",
	}
	for _, setting := range strictProfileSettings {
		settings = append(settings, setting.name)
	}
	for _, setting := range settings {
		t.Run(setting, func(t *testing.T) {
			_, err := resolveSecurityProfile(
				"catalog-only",
				":memory:?"+strings.ToUpper(setting)+"=true",
				"",
				nil,
				nil,
			)
			require.ErrorContains(t, err, "is owned by the security profile")
		})
	}
}

func TestResolveSecurityProfileRejectsRemoteDatabasePaths(t *testing.T) {
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
		"abfss://container@account.dfs.core.windows.net/database",
		"file:///tmp/database",
		"md:database",
		`\\server\share\database`,
		"//server/share/database",
	} {
		t.Run(path, func(t *testing.T) {
			_, err := resolveSecurityProfile("catalog-only", path, "", nil, nil)
			require.ErrorContains(t, err, "is not a local filesystem path")
		})
	}
}

func TestSecurityProfileInitializerStatements(t *testing.T) {
	initializer := &securityProfileInitializer{
		allowedDirectories: []string{"/srv/O'Brien"},
		allowedPaths:       []string{"/srv/data.parquet"},
	}
	execer := newRecordingExecer()

	require.NoError(t, initializer.initializeConnection(t.Context(), execer))
	require.Equal(t, []string{
		"SET temp_directory = ''",
		"SET allowed_directories = ['/srv/O''Brien']",
		"SET allowed_paths = ['/srv/data.parquet']",
		"SET enable_external_access = false",
		"SET lock_configuration = true",
	}, execer.snapshot())

	require.NoError(t, initializer.initializeConnection(t.Context(), execer))
	require.Len(t, execer.snapshot(), 5)
}

func TestSecurityProfileInitializerCachesFailure(t *testing.T) {
	sentinel := errors.New("unavailable")
	initializer := &securityProfileInitializer{}
	execer := newRecordingExecer()
	execer.failAt = 4
	execer.failErr = sentinel

	err := initializer.initializeConnection(t.Context(), execer)
	require.ErrorIs(t, err, sentinel)
	require.ErrorContains(t, err, "failed to set lock_configuration")

	err = initializer.initializeConnection(t.Context(), newRecordingExecer())
	require.ErrorIs(t, err, sentinel)
	assert.Len(t, execer.snapshot(), 5)
}

func TestSecurityProfileInitializerIsConcurrent(t *testing.T) {
	initializer := &securityProfileInitializer{}
	execer := newRecordingExecer()

	const count = 32
	errs := make(chan error, count)
	var wait sync.WaitGroup
	for range count {
		wait.Add(1)
		go func() {
			defer wait.Done()
			errs <- initializer.initializeConnection(t.Context(), execer)
		}()
	}
	wait.Wait()
	close(errs)
	for err := range errs {
		require.NoError(t, err)
	}
	assert.Len(t, execer.snapshot(), 5)
}

func TestSecurityProfileCreatesIndependentInitializers(t *testing.T) {
	profile := resolvedSecurityProfile{name: securityProfileCatalogOnly}
	first := profile.newConnectionInitializer()
	second := profile.newConnectionInitializer()
	firstExecer := newRecordingExecer()
	secondExecer := newRecordingExecer()

	require.NoError(t, first.initializeConnection(t.Context(), firstExecer))
	require.NoError(t, first.initializeConnection(t.Context(), firstExecer))
	require.NoError(t, second.initializeConnection(t.Context(), secondExecer))
	assert.Len(t, firstExecer.snapshot(), 5)
	assert.Len(t, secondExecer.snapshot(), 5)
}

func assertSecurityProfileDSN(t *testing.T, dsn string) {
	t.Helper()
	database, rawQuery, found := strings.Cut(dsn, "?")
	require.True(t, found)
	assert.Equal(t, ":memory:", database)
	query, err := url.ParseQuery(rawQuery)
	require.NoError(t, err)
	assert.Equal(t, "2", query.Get("threads"))
	for _, setting := range strictProfileSettings {
		assert.Equal(t, setting.value, query.Get(setting.name), setting.name)
	}
	assert.False(t, query.Has("enable_external_access"))
	assert.False(t, query.Has("lock_configuration"))
}

func TestSecurityProfileInitializerValidatesDependencies(t *testing.T) {
	initializer := &securityProfileInitializer{}
	var nilContext context.Context
	var nilExecer driver.ExecerContext
	require.EqualError(t, initializer.initializeConnection(nilContext, newRecordingExecer()), "security profile: nil context")
	require.EqualError(t, initializer.initializeConnection(t.Context(), nilExecer), "security profile: nil execer")
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
