// Package connector constructs initialized DuckDB connectors for Mosaic servers.
package connector

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/duckdb/duckdb-go/v2"
)

// Initializer performs trusted DuckDB initialization.
type Initializer func(context.Context, driver.ExecerContext) error

// Config defines DuckDB startup and runtime initialization.
type Config struct {
	// DSN is the database path and optional DuckDB query-string configuration.
	DSN string

	// Bootstrap runs exactly once before Policy is finalized. It may load trusted
	// extensions, create secrets, or attach catalogs that the locked server needs.
	Bootstrap Initializer

	// InitializeConnection runs for every physical connection after Bootstrap
	// and Policy finalization. It receives a non-canceling context derived from
	// the context passed to Open and must be safe for concurrent calls.
	InitializeConnection Initializer

	// Policy is nil for DuckDB compatibility behavior.
	Policy *ResourcePolicy
}

// LocalFilesOptions configures the filesystem capabilities of LocalFiles.
type LocalFilesOptions struct {
	// AllowedDirectories are read/write capabilities for complete directory trees.
	AllowedDirectories []string
	// AllowedPaths are read/write capabilities for exact files.
	AllowedPaths []string
}

// ResourcePolicy is an immutable DuckDB external-resource policy.
type ResourcePolicy struct {
	allowedDirectories []string
	allowedPaths       []string
	requireFiles       bool
}

// CatalogOnly disables external access outside DuckDB's primary-database internals.
func CatalogOnly() *ResourcePolicy {
	return &ResourcePolicy{}
}

// LocalFiles adds explicit local filesystem capabilities to CatalogOnly.
func LocalFiles(options LocalFilesOptions) *ResourcePolicy {
	return &ResourcePolicy{
		allowedDirectories: append([]string(nil), options.AllowedDirectories...),
		allowedPaths:       append([]string(nil), options.AllowedPaths...),
		requireFiles:       true,
	}
}

// Open creates a connector, completes trusted bootstrap and policy locking, and
// verifies the first physical connection before returning it to the caller.
func Open(ctx context.Context, config Config) (*duckdb.Connector, error) {
	if ctx == nil {
		return nil, errors.New("connector: nil context")
	}

	dsn, policy, err := resolveResourcePolicy(config.DSN, config.Policy)
	if err != nil {
		return nil, err
	}

	startup := startupInitializer{
		ctx:       ctx,
		bootstrap: config.Bootstrap,
		policy:    policy,
	}
	connectionCtx := context.WithoutCancel(ctx)
	initializeConnection := config.InitializeConnection
	duckdbConnector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		if err := startup.initialize(execer); err != nil {
			return err
		}
		if initializeConnection != nil {
			if err := initializeConnection(connectionCtx, execer); err != nil {
				return fmt.Errorf("connector: initialize connection: %w", err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("connector: create: %w", err)
	}

	conn, err := duckdbConnector.Connect(ctx)
	if err != nil {
		return nil, closeAfterError(duckdbConnector, fmt.Errorf("connector: initialize: %w", err))
	}
	if err := conn.Close(); err != nil {
		return nil, closeAfterError(duckdbConnector, fmt.Errorf("connector: close initialization connection: %w", err))
	}
	return duckdbConnector, nil
}

type startupInitializer struct {
	once      sync.Once
	err       error
	ctx       context.Context
	bootstrap Initializer
	policy    *resolvedResourcePolicy
}

func (s *startupInitializer) initialize(execer driver.ExecerContext) error {
	if execer == nil {
		return errors.New("connector: nil execer")
	}
	s.once.Do(func() {
		if s.bootstrap != nil {
			if err := s.bootstrap(s.ctx, execer); err != nil {
				s.err = fmt.Errorf("connector: bootstrap: %w", err)
				return
			}
		}
		if s.policy != nil {
			s.err = s.policy.finalize(s.ctx, execer)
		}
	})
	return s.err
}

type resolvedResourcePolicy struct {
	allowedDirectories []string
	allowedPaths       []string
}

type duckDBSetting struct {
	name  string
	value string
}

var strictPolicySettings = []duckDBSetting{
	{name: "allow_persistent_secrets", value: "false"},
	{name: "allow_community_extensions", value: "false"},
	{name: "allow_unsigned_extensions", value: "false"},
	{name: "allow_extensions_metadata_mismatch", value: "false"},
	{name: "allow_unredacted_secrets", value: "false"},
	{name: "allowed_configs", value: "[]"},
	{name: "autoinstall_known_extensions", value: "false"},
	{name: "autoload_known_extensions", value: "false"},
	{name: "enable_external_file_cache", value: "false"},
}

func resolveResourcePolicy(
	databaseDSN string,
	policy *ResourcePolicy,
) (string, *resolvedResourcePolicy, error) {
	if policy == nil {
		return databaseDSN, nil, nil
	}
	if err := validateLocalDatabaseDSN(databaseDSN); err != nil {
		return "", nil, err
	}
	if err := rejectPolicySettings(databaseDSN); err != nil {
		return "", nil, err
	}

	directories, err := canonicalLocalPaths(policy.allowedDirectories, true)
	if err != nil {
		return "", nil, fmt.Errorf("connector: invalid allowed directory: %w", err)
	}
	paths, err := canonicalLocalPaths(policy.allowedPaths, false)
	if err != nil {
		return "", nil, fmt.Errorf("connector: invalid allowed path: %w", err)
	}
	if policy.requireFiles && len(directories) == 0 && len(paths) == 0 {
		return "", nil, errors.New("connector: local-files policy requires at least one allowed directory or path")
	}

	dsn, err := addDuckDBSettings(databaseDSN, strictPolicySettings)
	if err != nil {
		return "", nil, err
	}
	return dsn, &resolvedResourcePolicy{
		allowedDirectories: directories,
		allowedPaths:       paths,
	}, nil
}

func (p *resolvedResourcePolicy) finalize(ctx context.Context, execer driver.ExecerContext) error {
	settings := []duckDBSetting{
		{name: "temp_directory", value: "''"},
		{name: "allowed_directories", value: duckDBStringList(p.allowedDirectories)},
		{name: "allowed_paths", value: duckDBStringList(p.allowedPaths)},
		{name: "enable_external_access", value: "false"},
		{name: "lock_configuration", value: "true"},
	}
	for _, setting := range settings {
		if _, err := execer.ExecContext(ctx, "SET "+setting.name+" = "+setting.value, nil); err != nil {
			return fmt.Errorf("connector: failed to set %s: %w", setting.name, err)
		}
	}
	return nil
}

func validateLocalDatabaseDSN(databaseDSN string) error {
	database, _, _ := strings.Cut(databaseDSN, "?")
	if database == "" || database == ":memory:" || hasWindowsDrivePrefix(database) {
		return nil
	}
	if isNetworkPath(database) {
		return fmt.Errorf("connector: database path %q is not a local filesystem path", database)
	}
	parsed, err := url.Parse(database)
	if err != nil {
		return fmt.Errorf("connector: invalid database path %q: %w", database, err)
	}
	if parsed.Scheme != "" || parsed.Host != "" {
		return fmt.Errorf("connector: database path %q is not a local filesystem path", database)
	}
	return nil
}

func hasWindowsDrivePrefix(path string) bool {
	if len(path) < 2 || path[1] != ':' {
		return false
	}
	letter := path[0]
	return letter >= 'a' && letter <= 'z' || letter >= 'A' && letter <= 'Z'
}

func isNetworkPath(path string) bool {
	return strings.HasPrefix(path, `\\`) || strings.HasPrefix(path, "//")
}

func addDuckDBSettings(databaseDSN string, settings []duckDBSetting) (string, error) {
	database, rawQuery, _ := strings.Cut(databaseDSN, "?")
	query, err := url.ParseQuery(rawQuery)
	if err != nil {
		return "", fmt.Errorf("connector: invalid database configuration: %w", err)
	}
	for _, setting := range settings {
		query.Set(setting.name, setting.value)
	}
	return database + "?" + query.Encode(), nil
}

func canonicalLocalPaths(values []string, directories bool) ([]string, error) {
	paths := make([]string, 0, len(values))
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			return nil, errors.New("path is blank")
		}
		parsed, err := url.Parse(value)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		if isNetworkPath(value) || parsed.Scheme != "" && !hasWindowsDrivePrefix(value) {
			return nil, fmt.Errorf("%q is not a local filesystem path", value)
		}

		absolute, err := filepath.Abs(value)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		absolute, err = filepath.EvalSymlinks(absolute)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		info, err := os.Stat(absolute)
		if err != nil {
			return nil, fmt.Errorf("%q: %w", value, err)
		}
		if directories != info.IsDir() {
			kind := "file"
			if directories {
				kind = "directory"
			}
			return nil, fmt.Errorf("%q is not a %s", value, kind)
		}
		if _, ok := seen[absolute]; ok {
			continue
		}
		seen[absolute] = struct{}{}
		paths = append(paths, absolute)
	}
	return paths, nil
}

func duckDBStringList(values []string) string {
	quoted := make([]string, len(values))
	for i, value := range values {
		quoted[i] = "'" + strings.ReplaceAll(value, "'", "''") + "'"
	}
	return "[" + strings.Join(quoted, ",") + "]"
}

func rejectPolicySettings(databaseDSN string) error {
	_, rawQuery, _ := strings.Cut(databaseDSN, "?")
	query, err := url.ParseQuery(rawQuery)
	if err != nil {
		return fmt.Errorf("connector: invalid database configuration: %w", err)
	}
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
	for existing := range query {
		for _, setting := range settings {
			if strings.EqualFold(existing, setting) {
				return fmt.Errorf("connector: database configuration %q is owned by the resource policy", existing)
			}
		}
	}
	return nil
}

func closeAfterError(duckdbConnector *duckdb.Connector, err error) error {
	return errors.Join(err, duckdbConnector.Close())
}
