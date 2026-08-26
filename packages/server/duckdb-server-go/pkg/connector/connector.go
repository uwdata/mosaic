// Package connector constructs initialized DuckDB connectors for Mosaic servers.
package connector

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"sync"

	"github.com/duckdb/duckdb-go/v2"
)

var (
	// ErrInvalidConfig indicates that connector configuration was rejected before DuckDB startup.
	ErrInvalidConfig = errors.New("connector: invalid configuration")
	// ErrStartup indicates that DuckDB bootstrap or connection initialization failed.
	ErrStartup = errors.New("connector: startup failed")
)

// Initializer performs trusted DuckDB initialization.
type Initializer func(context.Context, driver.ExecerContext) error

type config struct {
	policy                *ResourcePolicy
	bootstrap             Initializer
	connectionInitializer Initializer
}

// Option configures Open.
type Option interface {
	apply(*config) error
}

type optionFunc func(*config) error

func (f optionFunc) apply(cfg *config) error {
	if f == nil {
		return errors.New("option must not be nil")
	}
	return f(cfg)
}

// WithResourcePolicy applies a DuckDB external-resource policy. A nil policy
// preserves DuckDB compatibility behavior.
func WithResourcePolicy(policy *ResourcePolicy) Option {
	return optionFunc(func(cfg *config) error {
		cfg.policy = policy
		return nil
	})
}

// WithBootstrap configures trusted initialization that runs exactly once before
// the resource policy is finalized. ATTACH grants the database and its sidecars
// for the connector lifetime; DETACH does not revoke those paths.
func WithBootstrap(initializer Initializer) Option {
	return optionFunc(func(cfg *config) error {
		cfg.bootstrap = initializer
		return nil
	})
}

// WithConnectionInitializer configures initialization for every physical
// connection after bootstrap and policy finalization. The initializer receives
// a non-canceling context derived from the context passed to Open and must be
// safe for concurrent calls.
func WithConnectionInitializer(initializer Initializer) Option {
	return optionFunc(func(cfg *config) error {
		cfg.connectionInitializer = initializer
		return nil
	})
}

func applyOptions(options []Option) (config, error) {
	var cfg config
	for i, option := range options {
		if option == nil {
			return cfg, fmt.Errorf("option %d must not be nil", i)
		}
		if err := option.apply(&cfg); err != nil {
			return cfg, fmt.Errorf("apply option %d: %w", i, err)
		}
	}
	return cfg, nil
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
}

// CatalogOnly disables external access outside DuckDB's primary and bootstrap-attached database internals.
func CatalogOnly() *ResourcePolicy {
	return &ResourcePolicy{}
}

// LocalFiles adds explicit local filesystem capabilities to CatalogOnly.
func LocalFiles(options LocalFilesOptions) *ResourcePolicy {
	return &ResourcePolicy{
		allowedDirectories: append([]string(nil), options.AllowedDirectories...),
		allowedPaths:       append([]string(nil), options.AllowedPaths...),
	}
}

// Open creates a connector, completes trusted bootstrap and policy locking, and
// verifies the first physical connection before returning it to the caller. A
// file-backed database supports one live connector per process; share that
// connector across query pools rather than calling Open again for the same path.
func Open(ctx context.Context, dsn string, options ...Option) (*duckdb.Connector, error) {
	if ctx == nil {
		return nil, fmt.Errorf("%w: nil context", ErrInvalidConfig)
	}

	cfg, err := applyOptions(options)
	if err != nil {
		return nil, fmt.Errorf("%w: %w", ErrInvalidConfig, err)
	}
	policy := resolveResourcePolicy(cfg.policy)
	if policy != nil {
		dsn = addDuckDBSettings(dsn, strictPolicySettings)
	}

	startup := startupInitializer{
		ctx:       ctx,
		bootstrap: cfg.bootstrap,
		policy:    policy,
	}
	connectionCtx := context.WithoutCancel(ctx)
	initializeConnection := cfg.connectionInitializer
	duckdbConnector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		if err := startup.initialize(execer); err != nil {
			return err
		}
		if initializeConnection != nil {
			if err := initializeConnection(connectionCtx, execer); err != nil {
				return fmt.Errorf("%w: initialize connection: %w", ErrStartup, err)
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("%w: create: %w", ErrStartup, err)
	}

	conn, err := duckdbConnector.Connect(ctx)
	if err != nil {
		if !errors.Is(err, ErrStartup) {
			err = fmt.Errorf("%w: initialize: %w", ErrStartup, err)
		}
		return nil, closeAfterError(duckdbConnector, err)
	}
	if err := conn.Close(); err != nil {
		return nil, closeAfterError(duckdbConnector, fmt.Errorf("%w: close initialization connection: %w", ErrStartup, err))
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
		return errors.New("nil execer")
	}
	s.once.Do(func() {
		if s.bootstrap != nil {
			if err := s.bootstrap(s.ctx, execer); err != nil {
				s.err = fmt.Errorf("bootstrap: %w", err)
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

func resolveResourcePolicy(policy *ResourcePolicy) *resolvedResourcePolicy {
	if policy == nil {
		return nil
	}
	return &resolvedResourcePolicy{
		allowedDirectories: append([]string(nil), policy.allowedDirectories...),
		allowedPaths:       append([]string(nil), policy.allowedPaths...),
	}
}

func (p *resolvedResourcePolicy) finalize(ctx context.Context, execer driver.ExecerContext) error {
	// DuckDB rejects path and temp grants after external access is disabled.
	settings := []duckDBSetting{
		{name: "allow_persistent_secrets", value: "false"},
		{name: "allow_extensions_metadata_mismatch", value: "false"},
		{name: "allowed_configs", value: "[]"},
		{name: "autoinstall_known_extensions", value: "false"},
		{name: "autoload_known_extensions", value: "false"},
		{name: "enable_external_file_cache", value: "false"},
		{name: "temp_directory", value: "''"},
		{name: "allowed_directories", value: duckDBStringList(p.allowedDirectories)},
		{name: "allowed_paths", value: duckDBStringList(p.allowedPaths)},
		{name: "enable_external_access", value: "false"},
		{name: "lock_configuration", value: "true"},
	}
	for _, setting := range settings {
		if _, err := execer.ExecContext(ctx, "SET "+setting.name+" = "+setting.value, nil); err != nil {
			return fmt.Errorf("failed to set %s: %w", setting.name, err)
		}
	}
	return nil
}

func addDuckDBSettings(databaseDSN string, settings []duckDBSetting) string {
	if len(settings) == 0 {
		return databaseDSN
	}
	database, rawQuery, _ := strings.Cut(databaseDSN, "?")
	query := make(url.Values, len(settings))
	for _, setting := range settings {
		query.Set(setting.name, setting.value)
	}
	configured := query.Encode()
	if rawQuery != "" {
		// duckdb-go uses the first value for duplicate DSN settings.
		configured += "&" + rawQuery
	}
	return database + "?" + configured
}

func duckDBStringList(values []string) string {
	quoted := make([]string, len(values))
	for i, value := range values {
		quoted[i] = "'" + strings.ReplaceAll(value, "'", "''") + "'"
	}
	return "[" + strings.Join(quoted, ",") + "]"
}

func closeAfterError(duckdbConnector *duckdb.Connector, err error) error {
	return errors.Join(err, duckdbConnector.Close())
}
