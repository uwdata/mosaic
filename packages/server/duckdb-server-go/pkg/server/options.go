package server

import (
	"errors"
	"fmt"
	"log/slog"
	"reflect"
)

var (
	errNilOption     = errors.New("server: option must not be nil")
	errNilAuthorizer = errors.New("server: authorizer must not be nil")
)

type config struct {
	logger             *slog.Logger
	authorizer         Authorizer
	schemaMatchHeaders []string
}

func defaultConfig() config {
	return config{logger: slog.Default()}
}

// Option configures the handler returned by New. Implementations are provided
// by this package so invalid configuration can be rejected consistently.
type Option interface {
	apply(*config) error
}

type optionFunc func(*config) error

func (f optionFunc) apply(cfg *config) error {
	if f == nil {
		return errNilOption
	}
	return f(cfg)
}

func applyOptions(opts []Option) (config, error) {
	cfg := defaultConfig()
	for i, opt := range opts {
		if opt == nil {
			return config{}, fmt.Errorf("server: apply option %d: %w", i, errNilOption)
		}
		if err := opt.apply(&cfg); err != nil {
			return config{}, fmt.Errorf("server: apply option %d: %w", i, err)
		}
	}
	return cfg, nil
}

// WithLogger configures the server logger. A nil logger uses slog.Default.
func WithLogger(logger *slog.Logger) Option {
	return optionFunc(func(cfg *config) error {
		configured := logger
		if configured == nil {
			configured = slog.Default()
		}
		cfg.logger = configured
		return nil
	})
}

// WithAuthorizer configures per-request and per-command authorization. A nil
// Authorizer is invalid; omit this option to preserve unrestricted behavior.
func WithAuthorizer(authorizer Authorizer) Option {
	return optionFunc(func(cfg *config) error {
		if authorizer == nil || isNilValue(authorizer) {
			return errNilAuthorizer
		}
		cfg.authorizer = authorizer
		return nil
	})
}

func isNilValue(value any) bool {
	v := reflect.ValueOf(value)
	switch v.Kind() {
	case reflect.Chan, reflect.Func, reflect.Interface, reflect.Map, reflect.Pointer, reflect.Slice:
		return v.IsNil()
	default:
		return false
	}
}

// WithSchemaMatchHeaders configures the transitional request headers used to
// derive allowed schema names.
func WithSchemaMatchHeaders(headers ...string) Option {
	headers = append([]string(nil), headers...)
	return optionFunc(func(cfg *config) error {
		cfg.schemaMatchHeaders = append([]string(nil), headers...)
		return nil
	})
}
