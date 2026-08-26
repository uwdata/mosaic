// Package connector constructs initialized DuckDB connectors for Mosaic servers.
package connector

import (
	"context"
	"database/sql/driver"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"sync"

	"github.com/duckdb/duckdb-go/v2"
)

var (
	ErrInvalidConfig = errors.New("connector: invalid configuration")
	ErrStartup       = errors.New("connector: startup failed")
)

type Initializer func(context.Context, driver.ExecerContext) error

type config struct {
	restrictExternalAccess bool
	allowedDirectories     []string
	allowedPaths           []string
	settings               []duckDBSetting
	bootstrapInitializer   Initializer
	connectionInitializer  Initializer
}

type Option func(*config)

// WithCatalogOnly disables extension installation and autoloading, persistent
// secrets, and external access after bootstrap, then locks the configuration.
// Spill files and the external-file cache are disabled unless explicitly
// configured. Combining it with either grant option is redundant.
func WithCatalogOnly() Option {
	return func(cfg *config) {
		cfg.restrictExternalAccess = true
	}
}

// WithAllowedDirectories applies the same restrictions as WithCatalogOnly and
// grants access to DuckDB filesystem prefixes. Values may be local directory
// trees or remote URL prefixes supported by extensions loaded during bootstrap.
// Repeated calls append.
func WithAllowedDirectories(directories ...string) Option {
	values := append([]string(nil), directories...)
	return func(cfg *config) {
		cfg.restrictExternalAccess = true
		cfg.allowedDirectories = append(cfg.allowedDirectories, values...)
	}
}

// WithAllowedPaths applies the same restrictions as WithCatalogOnly and grants
// access to exact DuckDB filesystem paths, including remote URLs supported by
// extensions loaded during bootstrap. Repeated calls append.
func WithAllowedPaths(paths ...string) Option {
	values := append([]string(nil), paths...)
	return func(cfg *config) {
		cfg.restrictExternalAccess = true
		cfg.allowedPaths = append(cfg.allowedPaths, values...)
	}
}

// WithSetting sets a mutable global DuckDB setting after trusted bootstrap and
// before external-access finalization. Extension settings require the extension
// to be loaded during bootstrap. DSN configuration order is unspecified; use
// setting options when order matters.
func WithSetting(name, value string) Option {
	return func(cfg *config) {
		cfg.settings = append(cfg.settings, duckDBSetting{name: name, value: value})
	}
}

// WithMemoryLimit sets DuckDB's database-wide memory limit. It does not limit
// the Go process or Mosaic's encoded result cache.
func WithMemoryLimit(limit string) Option {
	return WithSetting("memory_limit", limit)
}

// WithThreads sets the total number of DuckDB worker threads.
func WithThreads(threads int) Option {
	return WithSetting("threads", strconv.Itoa(threads))
}

// WithTempDirectory enables temporary-file spilling to path. In locked mode,
// DuckDB also grants SQL read/write access to the complete directory tree.
func WithTempDirectory(path string) Option {
	return WithSetting("temp_directory", path)
}

// WithMaxTempDirectorySize limits the disk space used for temporary files when
// a temporary directory is configured.
func WithMaxTempDirectorySize(limit string) Option {
	return WithSetting("max_temp_directory_size", limit)
}

// WithExternalFileCache enables DuckDB's in-memory external-file cache. DuckDB
// 1.5.5 does not persist this cache to disk.
func WithExternalFileCache() Option {
	return WithSetting("enable_external_file_cache", "true")
}

// WithParquetMetadataCache caches parsed Parquet metadata in memory.
func WithParquetMetadataCache() Option {
	return WithSetting("parquet_metadata_cache", "true")
}

// WithBootstrapInitializer configures trusted initialization that runs exactly
// once before external access is restricted and configuration is locked. Typical
// uses include installing or loading extensions, attaching local or remote
// databases, and one-time catalog setup. Databases attached here remain usable
// after restricted external access blocks new access and ATTACH operations. A
// local ATTACH grants the database and its sidecars for the connector lifetime;
// DETACH does not revoke those paths.
func WithBootstrapInitializer(initializer Initializer) Option {
	return func(cfg *config) {
		cfg.bootstrapInitializer = initializer
	}
}

// WithConnectionInitializer configures initialization for every physical
// connection after bootstrap and external-access finalization. Typical uses
// include temporary views, tables, or macros and, on unlocked connectors,
// session defaults. The initializer receives a non-canceling context derived
// from the context passed to Open and must be safe for concurrent calls.
func WithConnectionInitializer(initializer Initializer) Option {
	return func(cfg *config) {
		cfg.connectionInitializer = initializer
	}
}

func applyOptions(options []Option) config {
	var cfg config
	for _, option := range options {
		option(&cfg)
	}
	return cfg
}

// Open creates a connector, completes trusted bootstrap and external-access
// locking, and verifies the first physical connection before returning it. A
// file-backed database supports one live connector per process; share that
// connector across query pools rather than calling Open again for the same path.
func Open(ctx context.Context, dsn string, options ...Option) (*duckdb.Connector, error) {
	if ctx == nil {
		return nil, fmt.Errorf("%w: nil context", ErrInvalidConfig)
	}

	cfg := applyOptions(options)
	if cfg.restrictExternalAccess {
		dsn = addDuckDBSettings(dsn, lockedExternalAccessSettings)
	}

	connectionCtx := context.WithoutCancel(ctx)
	var bootstrapOnce sync.Once
	var bootstrapErr error
	duckdbConnector, err := duckdb.NewConnector(dsn, func(execer driver.ExecerContext) error {
		bootstrapOnce.Do(func() {
			bootstrapErr = initializeBootstrap(ctx, execer, cfg)
		})
		if bootstrapErr != nil {
			return bootstrapErr
		}
		if cfg.connectionInitializer != nil {
			if err := cfg.connectionInitializer(connectionCtx, execer); err != nil {
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

func initializeBootstrap(ctx context.Context, execer driver.ExecerContext, cfg config) error {
	if execer == nil {
		return errors.New("nil execer")
	}
	if cfg.bootstrapInitializer != nil {
		if err := cfg.bootstrapInitializer(ctx, execer); err != nil {
			return fmt.Errorf("bootstrap: %w", err)
		}
	}
	if err := applyGlobalStringSettings(ctx, execer, cfg.settings); err != nil {
		return err
	}
	if cfg.restrictExternalAccess {
		return finalizeExternalAccess(ctx, execer, cfg)
	}
	return nil
}

type duckDBSetting struct {
	name  string
	value string
}

var lockedExternalAccessSettings = []duckDBSetting{
	{name: "allow_persistent_secrets", value: "false"},
	{name: "allow_community_extensions", value: "false"},
	{name: "allow_unsigned_extensions", value: "false"},
	{name: "allow_extensions_metadata_mismatch", value: "false"},
	{name: "allow_unredacted_secrets", value: "false"},
	{name: "allowed_configs", value: "[]"},
	{name: "autoinstall_known_extensions", value: "false"},
	{name: "autoload_known_extensions", value: "false"},
}

func finalizeExternalAccess(ctx context.Context, execer driver.ExecerContext, cfg config) error {
	persistentSecrets, err := currentPersistentSecretsSetting(ctx, execer)
	if err != nil {
		return err
	}

	// DuckDB rejects path and temp grants after external access is disabled.
	settings := make([]duckDBSetting, 0, 11)
	// DuckDB rejects even a same-value SET after bootstrap uses the secret manager.
	if persistentSecrets {
		settings = append(settings, duckDBSetting{name: "allow_persistent_secrets", value: "false"})
	}
	settings = append(settings, []duckDBSetting{
		{name: "allow_extensions_metadata_mismatch", value: "false"},
		{name: "allowed_configs", value: "[]"},
		{name: "autoinstall_known_extensions", value: "false"},
		{name: "autoload_known_extensions", value: "false"},
	}...)
	if !hasSetting(cfg.settings, "enable_external_file_cache") {
		settings = append(settings, duckDBSetting{name: "enable_external_file_cache", value: "false"})
	}
	if !hasSetting(cfg.settings, "temp_directory") {
		settings = append(settings, duckDBSetting{name: "temp_directory", value: "''"})
	}
	settings = append(settings, []duckDBSetting{
		{name: "allowed_directories", value: duckDBStringList(cfg.allowedDirectories)},
		{name: "allowed_paths", value: duckDBStringList(cfg.allowedPaths)},
		{name: "enable_external_access", value: "false"},
		{name: "lock_configuration", value: "true"},
	}...)
	return applySettingExpressions(ctx, execer, settings)
}

func applySettingExpressions(ctx context.Context, execer driver.ExecerContext, settings []duckDBSetting) error {
	for _, setting := range settings {
		if _, err := execer.ExecContext(ctx, "SET "+setting.name+" = "+setting.value, nil); err != nil {
			return fmt.Errorf("failed to set %s: %w", setting.name, err)
		}
	}
	return nil
}

func applyGlobalStringSettings(ctx context.Context, execer driver.ExecerContext, settings []duckDBSetting) error {
	for _, setting := range settings {
		if _, err := execer.ExecContext(
			ctx,
			"SET GLOBAL "+duckDBIdentifier(setting.name)+" = "+duckDBString(setting.value),
			nil,
		); err != nil {
			return fmt.Errorf("failed to set %s: %w", setting.name, err)
		}
	}
	return nil
}

func hasSetting(settings []duckDBSetting, name string) bool {
	for _, setting := range settings {
		if strings.EqualFold(setting.name, name) {
			return true
		}
	}
	return false
}

func currentPersistentSecretsSetting(ctx context.Context, execer driver.ExecerContext) (bool, error) {
	queryer, ok := execer.(driver.QueryerContext)
	if !ok {
		return false, errors.New("driver does not support reading allow_persistent_secrets")
	}
	rows, err := queryer.QueryContext(
		ctx,
		"SELECT current_setting('allow_persistent_secrets')::BOOLEAN",
		nil,
	)
	if err != nil {
		return false, fmt.Errorf("failed to read allow_persistent_secrets: %w", err)
	}

	values := make([]driver.Value, 1)
	readErr := rows.Next(values)
	closeErr := rows.Close()
	if readErr != nil {
		return false, fmt.Errorf("failed to read allow_persistent_secrets: %w", readErr)
	}
	if closeErr != nil {
		return false, fmt.Errorf("failed to read allow_persistent_secrets: close rows: %w", closeErr)
	}
	value, ok := values[0].(bool)
	if !ok {
		return false, fmt.Errorf("failed to read allow_persistent_secrets: unexpected value %T", values[0])
	}
	return value, nil
}

func addDuckDBSettings(databaseDSN string, settings []duckDBSetting) string {
	if len(settings) == 0 {
		return databaseDSN
	}
	query := make(url.Values, len(settings))
	for _, setting := range settings {
		query.Set(setting.name, setting.value)
	}
	separator := "?"
	if strings.Contains(databaseDSN, "?") {
		separator = "&"
	}
	return databaseDSN + separator + query.Encode()
}

func duckDBStringList(values []string) string {
	quoted := make([]string, len(values))
	for i, value := range values {
		quoted[i] = duckDBString(value)
	}
	return "[" + strings.Join(quoted, ",") + "]"
}

func duckDBString(value string) string {
	return "'" + strings.ReplaceAll(value, "'", "''") + "'"
}

func duckDBIdentifier(value string) string {
	return `"` + strings.ReplaceAll(value, `"`, `""`) + `"`
}

func closeAfterError(duckdbConnector *duckdb.Connector, err error) error {
	return errors.Join(err, duckdbConnector.Close())
}
