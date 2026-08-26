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
	ErrInvalidConfig = errors.New("connector: invalid configuration")
	ErrStartup       = errors.New("connector: startup failed")
)

type Initializer func(context.Context, driver.ExecerContext) error

type config struct {
	restrictExternalAccess bool
	allowedDirectories     []string
	allowedPaths           []string
	bootstrapInitializer   Initializer
	connectionInitializer  Initializer
}

type Option interface {
	apply(*config) error
}

type optionFunc func(*config) error

func (f optionFunc) apply(cfg *config) error {
	return f(cfg)
}

// WithCatalogOnly disables extension installation and autoloading, persistent
// secrets, temporary spill files, and external access after bootstrap, then
// locks the configuration. Combining it with either grant option is equivalent
// to using the grant option alone.
func WithCatalogOnly() Option {
	return optionFunc(func(cfg *config) error {
		cfg.restrictExternalAccess = true
		return nil
	})
}

// WithAllowedDirectories applies the same restrictions as WithCatalogOnly and
// grants access to DuckDB filesystem prefixes. Values may be local directory
// trees or remote URL prefixes supported by extensions loaded during bootstrap.
// Repeated calls append.
func WithAllowedDirectories(directories ...string) Option {
	values := append([]string(nil), directories...)
	return optionFunc(func(cfg *config) error {
		if err := validateGrantValues("allowed directory", values); err != nil {
			return err
		}
		cfg.restrictExternalAccess = true
		cfg.allowedDirectories = append(cfg.allowedDirectories, values...)
		return nil
	})
}

// WithAllowedPaths applies the same restrictions as WithCatalogOnly and grants
// access to exact DuckDB filesystem paths, including remote URLs supported by
// extensions loaded during bootstrap. Repeated calls append.
func WithAllowedPaths(paths ...string) Option {
	values := append([]string(nil), paths...)
	return optionFunc(func(cfg *config) error {
		if err := validateGrantValues("allowed path", values); err != nil {
			return err
		}
		cfg.restrictExternalAccess = true
		cfg.allowedPaths = append(cfg.allowedPaths, values...)
		return nil
	})
}

func validateGrantValues(name string, values []string) error {
	for i, value := range values {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("%s %d must not be blank", name, i+1)
		}
	}
	return nil
}

// WithBootstrapInitializer configures trusted initialization that runs exactly
// once before external access is restricted and configuration is locked. Typical
// uses include installing or loading extensions, attaching local or remote
// databases, and one-time catalog setup. Databases attached here remain usable
// after restricted external access blocks new access and ATTACH operations. A
// local ATTACH grants the database and its sidecars for the connector lifetime;
// DETACH does not revoke those paths.
func WithBootstrapInitializer(initializer Initializer) Option {
	return optionFunc(func(cfg *config) error {
		cfg.bootstrapInitializer = initializer
		return nil
	})
}

// WithConnectionInitializer configures initialization for every physical
// connection after bootstrap and external-access finalization. Typical uses
// include temporary views, tables, or macros and, on unlocked connectors,
// session defaults. The initializer receives a non-canceling context derived
// from the context passed to Open and must be safe for concurrent calls.
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

// Open creates a connector, completes trusted bootstrap and external-access
// locking, and verifies the first physical connection before returning it. A
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

func initializeBootstrap(
	ctx context.Context,
	execer driver.ExecerContext,
	cfg config,
) error {
	if execer == nil {
		return errors.New("nil execer")
	}
	if cfg.bootstrapInitializer != nil {
		if err := cfg.bootstrapInitializer(ctx, execer); err != nil {
			return fmt.Errorf("bootstrap: %w", err)
		}
	}
	if cfg.restrictExternalAccess {
		return finalizeExternalAccess(ctx, execer, cfg.allowedDirectories, cfg.allowedPaths)
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
	{name: "enable_external_file_cache", value: "false"},
}

func finalizeExternalAccess(
	ctx context.Context,
	execer driver.ExecerContext,
	allowedDirectories []string,
	allowedPaths []string,
) error {
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
		{name: "enable_external_file_cache", value: "false"},
		{name: "temp_directory", value: "''"},
		{name: "allowed_directories", value: duckDBStringList(allowedDirectories)},
		{name: "allowed_paths", value: duckDBStringList(allowedPaths)},
		{name: "enable_external_access", value: "false"},
		{name: "lock_configuration", value: "true"},
	}...)
	for _, setting := range settings {
		if _, err := execer.ExecContext(ctx, "SET "+setting.name+" = "+setting.value, nil); err != nil {
			return fmt.Errorf("failed to set %s: %w", setting.name, err)
		}
	}
	return nil
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
