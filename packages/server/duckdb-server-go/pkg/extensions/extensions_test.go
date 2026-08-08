package extensions_test

import (
	"context"
	"database/sql/driver"
	"errors"
	"reflect"
	"strings"
	"sync"
	"testing"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extensions"
)

func TestParseAndInstall(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		values []string
		want   []string
	}{
		{name: "no arguments", want: []string{}},
		{name: "empty flag", values: []string{""}, want: []string{}},
		{
			name:   "default repository and whitespace",
			values: []string{"  spatial  "},
			want:   []string{"INSTALL 'spatial'", "LOAD 'spatial'"},
		},
		{
			name: "comma grammar",
			values: []string{
				"spatial, h3|community, aws | core_nightly, custom|https://example.test/extensions",
			},
			want: []string{
				"INSTALL 'spatial'",
				"LOAD 'spatial'",
				"INSTALL 'h3' FROM community",
				"LOAD 'h3'",
				"INSTALL 'aws' FROM core_nightly",
				"LOAD 'aws'",
				"INSTALL 'custom' FROM 'https://example.test/extensions'",
				"LOAD 'custom'",
			},
		},
		{
			name:   "string slice expansion",
			values: []string{"spatial", "h3|community,aws|core_nightly"},
			want: []string{
				"INSTALL 'spatial'",
				"LOAD 'spatial'",
				"INSTALL 'h3' FROM community",
				"LOAD 'h3'",
				"INSTALL 'aws' FROM core_nightly",
				"LOAD 'aws'",
			},
		},
		{
			name:   "custom local repository",
			values: []string{"custom| /opt/duckdb repository "},
			want: []string{
				"INSTALL 'custom' FROM '/opt/duckdb repository'",
				"LOAD 'custom'",
			},
		},
		{
			name:   "semantic values are left to DuckDB",
			values: []string{"custom'; DROP TABLE secrets; --|Core"},
			want: []string{
				"INSTALL 'custom''; DROP TABLE secrets; --' FROM Core",
				"LOAD 'custom''; DROP TABLE secrets; --'",
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			execer := &recordingExecer{}
			if err := extensions.ParseAndInstall(
				context.Background(),
				execer,
				test.values...,
			); err != nil {
				t.Fatalf("ParseAndInstall() error = %v", err)
			}
			if got := queries(execer.snapshot()); !reflect.DeepEqual(got, test.want) {
				t.Fatalf("queries = %#v, want %#v", got, test.want)
			}
		})
	}
}

func TestParseAndInstallRejectsMalformedInput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name        string
		values      []string
		wantMessage string
	}{
		{name: "whitespace only", values: []string{"  \t  "}, wantMessage: "entry is blank"},
		{name: "blank first entry", values: []string{",spatial"}, wantMessage: "entry is blank"},
		{name: "blank last entry", values: []string{"spatial,"}, wantMessage: "entry is blank"},
		{name: "blank expanded value", values: []string{"spatial", ""}, wantMessage: "entry is blank"},
		{name: "blank name", values: []string{"|core"}, wantMessage: "name is blank"},
		{name: "blank repository", values: []string{"spatial|"}, wantMessage: "repository is blank"},
		{
			name:        "extra delimiter",
			values:      []string{"spatial|core|community"},
			wantMessage: "more than one repository delimiter",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			execer := &recordingExecer{}
			err := extensions.ParseAndInstall(context.Background(), execer, test.values...)
			if !errors.Is(err, extensions.ErrInvalidInput) {
				t.Fatalf("ParseAndInstall() error = %v, want ErrInvalidInput", err)
			}
			if !strings.Contains(err.Error(), test.wantMessage) {
				t.Fatalf("ParseAndInstall() error = %q, want substring %q", err, test.wantMessage)
			}
			if got := execer.snapshot(); len(got) != 0 {
				t.Fatalf("ParseAndInstall() made calls before rejecting input: %#v", got)
			}
		})
	}
}

func TestParseAndInstallErrorCoordinates(t *testing.T) {
	t.Parallel()

	err := extensions.ParseAndInstall(
		context.Background(),
		&recordingExecer{},
		"spatial",
		"h3,aws|core|community",
	)
	if !errors.Is(err, extensions.ErrInvalidInput) {
		t.Fatalf("ParseAndInstall() error = %v, want ErrInvalidInput", err)
	}
	for _, want := range []string{"input 2 entry 2", "more than one repository delimiter"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("ParseAndInstall() error = %q, want substring %q", err, want)
		}
	}
}

func TestDirectOperations(t *testing.T) {
	t.Parallel()

	ctx := context.WithValue(context.Background(), contextKey{}, "connector")
	execer := &recordingExecer{}

	if err := extensions.InstallAndLoad(ctx, execer, "default_repo", ""); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.InstallAndLoad(ctx, execer, "future_repo", "future7"); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.InstallAndLoad(
		ctx,
		execer,
		"custom_repo",
		"https://example.test/O'Brien repo",
	); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.InstallAndLoad(ctx, execer, "case_sensitive_repo", "Core"); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.InstallAndLoad(ctx, execer, "relative_custom_repo", "./Core"); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.LoadInstalled(ctx, execer, "preinstalled"); err != nil {
		t.Fatalf("LoadInstalled() error = %v", err)
	}
	if err := extensions.InstallAndLoadFile(
		ctx,
		execer,
		"/opt/O'Brien/custom.duckdb_extension",
	); err != nil {
		t.Fatalf("InstallAndLoadFile() error = %v", err)
	}
	if err := extensions.InstallAndLoadFile(ctx, execer, "/opt/HTTPS.v2.duckdb_extension"); err != nil {
		t.Fatalf("InstallAndLoadFile() error = %v", err)
	}
	if err := extensions.InstallAndLoadFile(ctx, execer, "/opt/.duckdb_extension"); err != nil {
		t.Fatalf("InstallAndLoadFile() error = %v", err)
	}
	if err := extensions.LoadFile(ctx, execer, "/opt/preinstalled.duckdb_extension"); err != nil {
		t.Fatalf("LoadFile() error = %v", err)
	}

	wantQueries := []string{
		"INSTALL 'default_repo'",
		"LOAD 'default_repo'",
		"INSTALL 'future_repo' FROM future7",
		"LOAD 'future_repo'",
		"INSTALL 'custom_repo' FROM 'https://example.test/O''Brien repo'",
		"LOAD 'custom_repo'",
		"INSTALL 'case_sensitive_repo' FROM Core",
		"LOAD 'case_sensitive_repo'",
		"INSTALL 'relative_custom_repo' FROM './Core'",
		"LOAD 'relative_custom_repo'",
		"LOAD 'preinstalled'",
		"INSTALL '/opt/O''Brien/custom.duckdb_extension'",
		"LOAD 'custom'",
		"INSTALL '/opt/HTTPS.v2.duckdb_extension'",
		"LOAD 'HTTPS'",
		"INSTALL '/opt/.duckdb_extension'",
		"LOAD 'duckdb_extension'",
		"LOAD '/opt/preinstalled.duckdb_extension'",
	}

	calls := execer.snapshot()
	if len(calls) != len(wantQueries) {
		t.Fatalf("operations made %d calls, want %d: %#v", len(calls), len(wantQueries), calls)
	}
	for index, call := range calls {
		if call.query != wantQueries[index] {
			t.Errorf("call %d query = %q, want %q", index+1, call.query, wantQueries[index])
		}
		if call.ctx != ctx {
			t.Errorf("call %d context was not the provided context", index+1)
		}
		if call.args != nil {
			t.Errorf("call %d args = %#v, want nil", index+1, call.args)
		}
	}
}

func TestParseAndInstallStopsAtFirstError(t *testing.T) {
	t.Parallel()

	sentinel := errors.New("duckdb unavailable")
	tests := []struct {
		name         string
		failAt       int
		wantCalls    int
		wantCategory error
		wantMessage  []string
	}{
		{
			name:         "install",
			failAt:       0,
			wantCalls:    1,
			wantCategory: extensions.ErrInstall,
			wantMessage:  []string{"spatial", "community", "install"},
		},
		{
			name:         "load",
			failAt:       1,
			wantCalls:    2,
			wantCategory: extensions.ErrLoad,
			wantMessage:  []string{"spatial", "community", "load"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			execer := &recordingExecer{failAt: test.failAt, failErr: sentinel}
			err := extensions.ParseAndInstall(
				context.Background(),
				execer,
				"spatial|community,httpfs",
			)
			if !errors.Is(err, sentinel) {
				t.Fatalf("ParseAndInstall() error = %v, want wrapped sentinel", err)
			}
			if !errors.Is(err, test.wantCategory) {
				t.Fatalf("ParseAndInstall() error = %v, want category %v", err, test.wantCategory)
			}
			for _, part := range test.wantMessage {
				if !strings.Contains(err.Error(), part) {
					t.Errorf("ParseAndInstall() error = %q, want substring %q", err, part)
				}
			}
			if got := len(execer.snapshot()); got != test.wantCalls {
				t.Fatalf("ParseAndInstall() made %d calls, want %d", got, test.wantCalls)
			}
		})
	}
}

func TestInstallAndLoadFileReportsDerivedName(t *testing.T) {
	t.Parallel()

	err := extensions.InstallAndLoadFile(
		context.Background(),
		&recordingExecer{failAt: 1, failErr: errors.New("load rejected")},
		"/opt/custom.duckdb_extension",
	)
	if !errors.Is(err, extensions.ErrLoad) {
		t.Fatalf("InstallAndLoadFile() error = %v, want ErrLoad", err)
	}
	if !strings.Contains(err.Error(), `for "custom"`) {
		t.Fatalf("InstallAndLoadFile() error = %q, want derived installed name", err)
	}
}

func TestParseAndInstallRepeatsEachInvocation(t *testing.T) {
	t.Parallel()

	execer := &recordingExecer{}
	for range 2 {
		if err := extensions.ParseAndInstall(
			context.Background(),
			execer,
			"spatial|core",
		); err != nil {
			t.Fatalf("ParseAndInstall() error = %v", err)
		}
	}

	want := []string{
		"INSTALL 'spatial' FROM core",
		"LOAD 'spatial'",
		"INSTALL 'spatial' FROM core",
		"LOAD 'spatial'",
	}
	if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
		t.Fatalf("queries = %#v, want %#v", got, want)
	}
}

func TestParseAndInstallPreservesOrderAndDuplicates(t *testing.T) {
	t.Parallel()

	execer := &recordingExecer{}
	err := extensions.ParseAndInstall(
		context.Background(),
		execer,
		"httpfs,HTTPFS,spatial|core,SPATIAL|community,httpfs",
	)
	if err != nil {
		t.Fatalf("ParseAndInstall() error = %v", err)
	}
	want := []string{
		"INSTALL 'httpfs'",
		"LOAD 'httpfs'",
		"INSTALL 'HTTPFS'",
		"LOAD 'HTTPFS'",
		"INSTALL 'spatial' FROM core",
		"LOAD 'spatial'",
		"INSTALL 'SPATIAL' FROM community",
		"LOAD 'SPATIAL'",
		"INSTALL 'httpfs'",
		"LOAD 'httpfs'",
	}
	if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
		t.Fatalf("queries = %#v, want %#v", got, want)
	}
}

func TestDirectOperationsQuoteDuckDBValues(t *testing.T) {
	t.Parallel()

	ctx := context.Background()
	execer := &recordingExecer{}
	if err := extensions.InstallAndLoad(
		ctx,
		execer,
		"custom'; DROP TABLE secrets; --",
		"/srv/O'Brien; ATTACH 'evil.db",
	); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.InstallAndLoad(ctx, execer, "literal", " /srv/repository "); err != nil {
		t.Fatalf("InstallAndLoad() error = %v", err)
	}
	if err := extensions.LoadFile(
		ctx,
		execer,
		" /opt/O'Brien; DROP TABLE secrets.duckdb_extension ",
	); err != nil {
		t.Fatalf("LoadFile() error = %v", err)
	}
	if err := extensions.InstallAndLoadFile(
		ctx,
		execer,
		"/opt/O'Brien'; DROP TABLE secrets.duckdb_extension",
	); err != nil {
		t.Fatalf("InstallAndLoadFile() error = %v", err)
	}

	want := []string{
		"INSTALL 'custom''; DROP TABLE secrets; --' FROM '/srv/O''Brien; ATTACH ''evil.db'",
		"LOAD 'custom''; DROP TABLE secrets; --'",
		"INSTALL 'literal' FROM ' /srv/repository '",
		"LOAD 'literal'",
		"LOAD ' /opt/O''Brien; DROP TABLE secrets.duckdb_extension '",
		"INSTALL '/opt/O''Brien''; DROP TABLE secrets.duckdb_extension'",
		"LOAD 'O''Brien''; DROP TABLE secrets'",
	}
	if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
		t.Fatalf("queries = %#v, want %#v", got, want)
	}
}

func TestFileOperationsDisambiguateBarePaths(t *testing.T) {
	t.Parallel()

	execer := &recordingExecer{}
	if err := extensions.LoadFile(context.Background(), execer, "reader"); err != nil {
		t.Fatalf("LoadFile() error = %v", err)
	}
	if err := extensions.InstallAndLoadFile(context.Background(), execer, "writer"); err != nil {
		t.Fatalf("InstallAndLoadFile() error = %v", err)
	}
	if err := extensions.LoadFile(context.Background(), execer, "reader"); err != nil {
		t.Fatalf("LoadFile() error = %v", err)
	}

	want := []string{
		"LOAD './reader'",
		"INSTALL './writer'",
		"LOAD 'writer'",
		"LOAD './reader'",
	}
	if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
		t.Fatalf("queries = %#v, want %#v", got, want)
	}
}

func TestParseAndInstallIsSafeForConcurrentUse(t *testing.T) {
	t.Parallel()

	const count = 32
	errorsCh := make(chan error, count)
	var wait sync.WaitGroup
	for range count {
		wait.Add(1)
		go func() {
			defer wait.Done()
			execer := &recordingExecer{}
			if err := extensions.ParseAndInstall(
				context.Background(),
				execer,
				"spatial|core",
			); err != nil {
				errorsCh <- err
				return
			}
			want := []string{"INSTALL 'spatial' FROM core", "LOAD 'spatial'"}
			if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
				errorsCh <- errors.New("unexpected statements")
			}
		}()
	}
	wait.Wait()
	close(errorsCh)
	for err := range errorsCh {
		t.Errorf("concurrent ParseAndInstall() error = %v", err)
	}
}

func TestOperationsValidateDependencies(t *testing.T) {
	t.Parallel()

	var nilContext context.Context
	var nilExecer driver.ExecerContext
	if err := extensions.ParseAndInstall(nilContext, nilExecer); err != nil {
		t.Fatalf("empty ParseAndInstall() error = %v", err)
	}
	if err := extensions.ParseAndInstall(nilContext, nilExecer, ""); err != nil {
		t.Fatalf("empty-flag ParseAndInstall() error = %v", err)
	}

	operations := []struct {
		name string
		call func(context.Context, driver.ExecerContext) error
	}{
		{
			name: "parse and install",
			call: func(ctx context.Context, execer driver.ExecerContext) error {
				return extensions.ParseAndInstall(ctx, execer, "spatial")
			},
		},
		{
			name: "install and load",
			call: func(ctx context.Context, execer driver.ExecerContext) error {
				return extensions.InstallAndLoad(ctx, execer, "spatial", "")
			},
		},
		{
			name: "load installed",
			call: func(ctx context.Context, execer driver.ExecerContext) error {
				return extensions.LoadInstalled(ctx, execer, "spatial")
			},
		},
		{
			name: "install and load file",
			call: func(ctx context.Context, execer driver.ExecerContext) error {
				return extensions.InstallAndLoadFile(ctx, execer, "/opt/spatial.duckdb_extension")
			},
		},
		{
			name: "load file",
			call: func(ctx context.Context, execer driver.ExecerContext) error {
				return extensions.LoadFile(ctx, execer, "/opt/spatial.duckdb_extension")
			},
		},
	}

	for _, operation := range operations {
		t.Run(operation.name, func(t *testing.T) {
			t.Parallel()

			if err := operation.call(nilContext, &recordingExecer{}); err == nil {
				t.Fatal("nil context error = nil")
			}
			if err := operation.call(context.Background(), nilExecer); err == nil {
				t.Fatal("nil execer error = nil")
			}
		})
	}
}

type contextKey struct{}

type recordedCall struct {
	ctx   context.Context
	query string
	args  []driver.NamedValue
}

type recordingExecer struct {
	mu      sync.Mutex
	calls   []recordedCall
	failAt  int
	failErr error
}

func (e *recordingExecer) ExecContext(
	ctx context.Context,
	query string,
	args []driver.NamedValue,
) (driver.Result, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	index := len(e.calls)
	e.calls = append(e.calls, recordedCall{
		ctx:   ctx,
		query: query,
		args:  append([]driver.NamedValue(nil), args...),
	})
	if e.failErr != nil && index == e.failAt {
		return nil, e.failErr
	}
	return driver.RowsAffected(0), nil
}

func (e *recordingExecer) snapshot() []recordedCall {
	e.mu.Lock()
	defer e.mu.Unlock()
	return append([]recordedCall(nil), e.calls...)
}

func queries(calls []recordedCall) []string {
	result := make([]string, len(calls))
	for index, call := range calls {
		result[index] = call.query
	}
	return result
}
