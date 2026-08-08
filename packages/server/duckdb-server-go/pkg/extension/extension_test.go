package extension_test

import (
	"context"
	"database/sql/driver"
	"errors"
	"reflect"
	"strings"
	"sync"
	"testing"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/extension"
)

func TestConstructors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		got  extension.Spec
		want extension.Spec
	}{
		{
			name: "install named",
			got:  extension.InstallAndLoad("spatial", extension.Community),
			want: extension.Spec{
				Name:       "spatial",
				Repository: extension.Community,
				Mode:       extension.ModeInstallAndLoad,
			},
		},
		{
			name: "load installed",
			got:  extension.LoadInstalled("spatial"),
			want: extension.Spec{Name: "spatial", Mode: extension.ModeLoadOnly},
		},
		{
			name: "install file",
			got:  extension.InstallAndLoadFile("/opt/spatial.duckdb_extension"),
			want: extension.Spec{
				Path: "/opt/spatial.duckdb_extension",
				Mode: extension.ModeInstallAndLoad,
			},
		},
		{
			name: "load file",
			got:  extension.LoadFile("/opt/spatial.duckdb_extension"),
			want: extension.Spec{
				Path: "/opt/spatial.duckdb_extension",
				Mode: extension.ModeLoadOnly,
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if !reflect.DeepEqual(test.got, test.want) {
				t.Fatalf("constructor returned %#v, want %#v", test.got, test.want)
			}
		})
	}
}

func TestRepositoryConstants(t *testing.T) {
	t.Parallel()

	got := []extension.Repository{
		extension.Core,
		extension.CoreNightly,
		extension.Community,
		extension.LocalBuildDebug,
		extension.LocalBuildRelease,
	}
	want := []extension.Repository{
		"core",
		"core_nightly",
		"community",
		"local_build_debug",
		"local_build_release",
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("repositories = %#v, want %#v", got, want)
	}
}

func TestParse(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		values []string
		want   []extension.Spec
	}{
		{name: "no arguments"},
		{name: "empty flag", values: []string{""}},
		{
			name:   "default repository and whitespace",
			values: []string{"  spatial  "},
			want:   []extension.Spec{extension.InstallAndLoad("spatial", extension.Core)},
		},
		{
			name:   "comma grammar",
			values: []string{"spatial, h3|community, aws | core_nightly"},
			want: []extension.Spec{
				extension.InstallAndLoad("spatial", extension.Core),
				extension.InstallAndLoad("h3", extension.Community),
				extension.InstallAndLoad("aws", extension.CoreNightly),
			},
		},
		{
			name:   "string slice expansion",
			values: []string{"spatial", "h3|community,aws|core_nightly"},
			want: []extension.Spec{
				extension.InstallAndLoad("spatial", extension.Core),
				extension.InstallAndLoad("h3", extension.Community),
				extension.InstallAndLoad("aws", extension.CoreNightly),
			},
		},
		{
			name:   "custom local repository",
			values: []string{"custom| /opt/duckdb repository "},
			want: []extension.Spec{
				extension.InstallAndLoad("custom", extension.Repository("/opt/duckdb repository")),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			got, err := extension.Parse(test.values...)
			if err != nil {
				t.Fatalf("Parse() error = %v", err)
			}
			if !reflect.DeepEqual(got, test.want) {
				t.Fatalf("Parse() = %#v, want %#v", got, test.want)
			}
		})
	}
}

func TestParseRejectsMalformedInput(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		values []string
	}{
		{name: "whitespace only", values: []string{"  \t  "}},
		{name: "blank first entry", values: []string{",spatial"}},
		{name: "blank last entry", values: []string{"spatial,"}},
		{name: "blank expanded value", values: []string{"spatial", ""}},
		{name: "blank name", values: []string{"|core"}},
		{name: "blank repository", values: []string{"spatial|"}},
		{name: "extra delimiter", values: []string{"spatial|core|community"}},
		{name: "unsafe identifier", values: []string{"spatial;DROP TABLE secrets"}},
		{name: "single quoted name", values: []string{"'spatial'"}},
		{name: "single quoted repository", values: []string{"spatial|'core'"}},
		{name: "double quoted repository", values: []string{"spatial|\"core\""}},
		{name: "repository control character", values: []string{"spatial|https://example.test/\nrepo"}},
		{name: "duplicate name", values: []string{"spatial,SPATIAL"}},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if _, err := extension.Parse(test.values...); err == nil {
				t.Fatal("Parse() error = nil")
			}
		})
	}
}

func TestInitializerStatements(t *testing.T) {
	t.Parallel()

	ctx := context.WithValue(context.Background(), contextKey{}, "connector")
	specs := []extension.Spec{
		extension.InstallAndLoad("default_repo", ""),
		extension.InstallAndLoad("core_repo", extension.Core),
		extension.InstallAndLoad("nightly_repo", extension.CoreNightly),
		extension.InstallAndLoad("community_repo", extension.Community),
		extension.InstallAndLoad("debug_repo", extension.LocalBuildDebug),
		extension.InstallAndLoad("release_repo", extension.LocalBuildRelease),
		extension.InstallAndLoad("custom_repo", extension.Repository("https://example.test/O'Brien repo")),
		extension.LoadInstalled("preinstalled"),
		extension.InstallAndLoadFile("/opt/O'Brien/custom.duckdb_extension"),
		extension.LoadFile("/opt/preinstalled.duckdb_extension"),
	}

	initializer, err := extension.NewInitializer(ctx, specs...)
	if err != nil {
		t.Fatalf("NewInitializer() error = %v", err)
	}

	// Mutating caller-owned specifications after construction must not change
	// the precompiled statement plan.
	specs[0] = extension.LoadInstalled("mutated")

	execer := &recordingExecer{}
	if err := initializer(execer); err != nil {
		t.Fatalf("Initializer() error = %v", err)
	}

	wantQueries := []string{
		"INSTALL default_repo FROM core",
		"LOAD default_repo",
		"INSTALL core_repo FROM core",
		"LOAD core_repo",
		"INSTALL nightly_repo FROM core_nightly",
		"LOAD nightly_repo",
		"INSTALL community_repo FROM community",
		"LOAD community_repo",
		"INSTALL debug_repo FROM local_build_debug",
		"LOAD debug_repo",
		"INSTALL release_repo FROM local_build_release",
		"LOAD release_repo",
		"INSTALL custom_repo FROM 'https://example.test/O''Brien repo'",
		"LOAD custom_repo",
		"LOAD preinstalled",
		"INSTALL '/opt/O''Brien/custom.duckdb_extension'",
		"LOAD '/opt/O''Brien/custom.duckdb_extension'",
		"LOAD '/opt/preinstalled.duckdb_extension'",
	}

	calls := execer.snapshot()
	if len(calls) != len(wantQueries) {
		t.Fatalf("Initializer() made %d calls, want %d: %#v", len(calls), len(wantQueries), calls)
	}
	for index, call := range calls {
		if call.query != wantQueries[index] {
			t.Errorf("call %d query = %q, want %q", index+1, call.query, wantQueries[index])
		}
		if call.ctx != ctx {
			t.Errorf("call %d context was not the connector context", index+1)
		}
		if call.args != nil {
			t.Errorf("call %d args = %#v, want nil", index+1, call.args)
		}
	}
}

func TestInitializerStopsAtFirstError(t *testing.T) {
	t.Parallel()

	sentinel := errors.New("duckdb unavailable")
	tests := []struct {
		name        string
		failAt      int
		wantCalls   int
		wantMessage []string
	}{
		{
			name:        "install",
			failAt:      0,
			wantCalls:   1,
			wantMessage: []string{"spatial", "community", "INSTALL"},
		},
		{
			name:        "load",
			failAt:      1,
			wantCalls:   2,
			wantMessage: []string{"spatial", "community", "LOAD"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()

			initializer, err := extension.NewInitializer(
				context.Background(),
				extension.InstallAndLoad("spatial", extension.Community),
				extension.LoadInstalled("httpfs"),
			)
			if err != nil {
				t.Fatalf("NewInitializer() error = %v", err)
			}

			execer := &recordingExecer{failAt: test.failAt, failErr: sentinel}
			err = initializer(execer)
			if !errors.Is(err, sentinel) {
				t.Fatalf("Initializer() error = %v, want wrapped sentinel", err)
			}
			for _, part := range test.wantMessage {
				if !strings.Contains(err.Error(), part) {
					t.Errorf("Initializer() error = %q, want substring %q", err, part)
				}
			}
			if got := len(execer.snapshot()); got != test.wantCalls {
				t.Fatalf("Initializer() made %d calls, want %d", got, test.wantCalls)
			}
		})
	}
}

func TestInitializerRepeatsForEveryConnection(t *testing.T) {
	t.Parallel()

	initializer, err := extension.NewInitializer(
		context.Background(),
		extension.InstallAndLoad("spatial", extension.Core),
	)
	if err != nil {
		t.Fatalf("NewInitializer() error = %v", err)
	}

	execer := &recordingExecer{}
	if err := initializer(execer); err != nil {
		t.Fatalf("first Initializer() error = %v", err)
	}
	if err := initializer(execer); err != nil {
		t.Fatalf("second Initializer() error = %v", err)
	}

	want := []string{
		"INSTALL spatial FROM core",
		"LOAD spatial",
		"INSTALL spatial FROM core",
		"LOAD spatial",
	}
	if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
		t.Fatalf("queries = %#v, want %#v", got, want)
	}
}

func TestInitializerIsSafeForConcurrentUse(t *testing.T) {
	t.Parallel()

	initializer, err := extension.NewInitializer(
		context.Background(),
		extension.InstallAndLoad("spatial", extension.Core),
	)
	if err != nil {
		t.Fatalf("NewInitializer() error = %v", err)
	}

	const count = 32
	errorsCh := make(chan error, count)
	var wait sync.WaitGroup
	for range count {
		wait.Add(1)
		go func() {
			defer wait.Done()
			execer := &recordingExecer{}
			if err := initializer(execer); err != nil {
				errorsCh <- err
				return
			}
			want := []string{"INSTALL spatial FROM core", "LOAD spatial"}
			if got := queries(execer.snapshot()); !reflect.DeepEqual(got, want) {
				errorsCh <- errors.New("unexpected query plan")
			}
		}()
	}
	wait.Wait()
	close(errorsCh)
	for err := range errorsCh {
		t.Errorf("concurrent Initializer() error = %v", err)
	}
}

func TestNewInitializerRejectsInvalidSpecifications(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		specs []extension.Spec
	}{
		{name: "no source", specs: []extension.Spec{{}}},
		{name: "blank name", specs: []extension.Spec{{Name: "  "}}},
		{name: "blank path", specs: []extension.Spec{{Path: "  "}}},
		{name: "name and path", specs: []extension.Spec{{Name: "spatial", Path: "/tmp/spatial"}}},
		{name: "invalid mode", specs: []extension.Spec{{Name: "spatial", Mode: extension.Mode(99)}}},
		{name: "unsafe identifier", specs: []extension.Spec{{Name: "spatial-name"}}},
		{name: "quoted identifier", specs: []extension.Spec{{Name: "'spatial'"}}},
		{name: "control in name", specs: []extension.Spec{{Name: "spatial\n"}}},
		{name: "blank custom repository", specs: []extension.Spec{{Name: "spatial", Repository: " "}}},
		{name: "quoted repository", specs: []extension.Spec{{Name: "spatial", Repository: "'core'"}}},
		{name: "control in repository", specs: []extension.Spec{{Name: "spatial", Repository: "https://repo\n"}}},
		{name: "invalid UTF-8 repository", specs: []extension.Spec{{Name: "spatial", Repository: extension.Repository(string([]byte{0xff}))}}},
		{name: "repository in load-only mode", specs: []extension.Spec{{Name: "spatial", Repository: extension.Core, Mode: extension.ModeLoadOnly}}},
		{name: "repository with file", specs: []extension.Spec{{Path: "/tmp/spatial", Repository: extension.Core}}},
		{name: "quoted path", specs: []extension.Spec{{Path: "'/tmp/spatial'"}}},
		{name: "control in path", specs: []extension.Spec{{Path: "/tmp/spatial\n"}}},
		{
			name: "duplicate named target",
			specs: []extension.Spec{
				extension.InstallAndLoad("spatial", extension.Core),
				extension.LoadInstalled("SPATIAL"),
			},
		},
		{
			name: "duplicate file target",
			specs: []extension.Spec{
				extension.InstallAndLoadFile("/tmp/spatial"),
				extension.LoadFile("/tmp/spatial"),
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			if _, err := extension.NewInitializer(context.Background(), test.specs...); err == nil {
				t.Fatal("NewInitializer() error = nil")
			}
		})
	}
}

func TestInitializerEdgeCases(t *testing.T) {
	t.Parallel()

	//nolint:staticcheck // The API explicitly rejects a nil connector context.
	if initializer, err := extension.NewInitializer(nil); err == nil || initializer != nil {
		t.Fatalf("NewInitializer(nil) = (%v, %v), want (nil, error)", initializer, err)
	}

	initializer, err := extension.NewInitializer(context.Background())
	if err != nil {
		t.Fatalf("NewInitializer() error = %v", err)
	}
	if initializer == nil {
		t.Fatal("NewInitializer() returned a nil initializer")
	}
	if err := initializer(nil); err != nil {
		t.Fatalf("empty Initializer(nil) error = %v", err)
	}

	initializer, err = extension.NewInitializer(
		context.Background(),
		extension.LoadInstalled("spatial"),
	)
	if err != nil {
		t.Fatalf("NewInitializer() error = %v", err)
	}
	if err := initializer(nil); err == nil {
		t.Fatal("non-empty Initializer(nil) error = nil")
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
