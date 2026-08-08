package server

import (
	"errors"
	"fmt"
	"log/slog"
)

var errNilOption = errors.New("server: option must not be nil")

type config struct {
	logger             *slog.Logger
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

// WithSchemaMatchHeaders configures the transitional request headers used to
// derive allowed schema names.
func WithSchemaMatchHeaders(headers ...string) Option {
	headers = append([]string(nil), headers...)
	return optionFunc(func(cfg *config) error {
		cfg.schemaMatchHeaders = append([]string(nil), headers...)
		return nil
	})
}
