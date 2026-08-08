package server

import (
	"errors"
	"fmt"
	"log/slog"
	"path"
	"reflect"
	"strings"
	"time"
)

var (
	errNilOption     = errors.New("server: option must not be nil")
	errNilAuthorizer = errors.New("server: authorizer must not be nil")
)

// CORSOptions configures cross-origin HTTP access. Its zero value grants no
// cross-origin CORS permissions.
type CORSOptions struct {
	// AllowedOrigins lists the exact scheme://host[:port] origins allowed to
	// access the server.
	AllowedOrigins []string
	// AllowedHeaders lists the request headers allowed in a preflight request.
	// The zero value permits Accept and Content-Type for the JSON API.
	AllowedHeaders []string
	// AllowCredentials permits credentialed requests from AllowedOrigins.
	AllowCredentials bool
	// AllowAllOrigins explicitly allows every origin. It cannot be combined
	// with AllowedOrigins or AllowCredentials.
	AllowAllOrigins bool
	// AllowAllHeaders explicitly allows every requested header. It cannot be
	// combined with AllowedHeaders.
	AllowAllHeaders bool
	// MaxAge controls how long browsers may cache a successful preflight.
	MaxAge time.Duration
}

// WebSocketOptions configures cross-origin WebSocket access. Its zero value
// retains the default same-host origin check.
type WebSocketOptions struct {
	// AllowedOrigins lists additional authorized origin host patterns. Patterns
	// use path.Match syntax and are matched case-insensitively. A pattern that
	// contains "://" is matched against scheme://host; other patterns are
	// matched against the origin host.
	AllowedOrigins []string
	// AllowAllOrigins explicitly disables WebSocket origin verification. It
	// cannot be combined with AllowedOrigins.
	AllowAllOrigins bool
}

type config struct {
	logger             *slog.Logger
	authorizer         Authorizer
	schemaMatchHeaders []string
	cors               CORSOptions
	websocket          WebSocketOptions
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

// WithCORS configures cross-origin HTTP access.
func WithCORS(options CORSOptions) Option {
	options.AllowedOrigins = append([]string(nil), options.AllowedOrigins...)
	options.AllowedHeaders = append([]string(nil), options.AllowedHeaders...)
	return optionFunc(func(cfg *config) error {
		if options.AllowAllOrigins && len(options.AllowedOrigins) != 0 {
			return errors.New("server: CORS AllowAllOrigins cannot be combined with AllowedOrigins")
		}
		if options.AllowAllOrigins && options.AllowCredentials {
			return errors.New("server: CORS AllowAllOrigins cannot be combined with AllowCredentials")
		}
		if options.AllowAllHeaders && len(options.AllowedHeaders) != 0 {
			return errors.New("server: CORS AllowAllHeaders cannot be combined with AllowedHeaders")
		}
		if options.MaxAge < 0 {
			return errors.New("server: CORS MaxAge must not be negative")
		}

		origins, err := copyNonEmpty("CORS allowed origin", options.AllowedOrigins, true)
		if err != nil {
			return err
		}
		for i, origin := range origins {
			if !isHTTPOrigin(origin) {
				return fmt.Errorf("server: invalid CORS allowed origin %q", origin)
			}
			origins[i] = strings.ToLower(origin)
		}
		headers, err := copyNonEmpty("CORS allowed header", options.AllowedHeaders, true)
		if err != nil {
			return err
		}

		configured := options
		configured.AllowedOrigins = origins
		configured.AllowedHeaders = headers
		cfg.cors = configured
		return nil
	})
}

// WithWebSocket configures cross-origin WebSocket access.
func WithWebSocket(options WebSocketOptions) Option {
	options.AllowedOrigins = append([]string(nil), options.AllowedOrigins...)
	return optionFunc(func(cfg *config) error {
		if options.AllowAllOrigins && len(options.AllowedOrigins) != 0 {
			return errors.New("server: WebSocket AllowAllOrigins cannot be combined with AllowedOrigins")
		}

		origins, err := copyNonEmpty("WebSocket allowed origin", options.AllowedOrigins, true)
		if err != nil {
			return err
		}
		for _, origin := range origins {
			if _, err := path.Match(origin, ""); err != nil {
				return fmt.Errorf("server: invalid WebSocket allowed origin %q: %w", origin, err)
			}
		}

		configured := options
		configured.AllowedOrigins = origins
		cfg.websocket = configured
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

func copyNonEmpty(name string, values []string, rejectWildcard bool) ([]string, error) {
	if len(values) == 0 {
		return nil, nil
	}

	copied := make([]string, len(values))
	for i, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			return nil, fmt.Errorf("server: %s at index %d must not be empty", name, i)
		}
		if rejectWildcard && value == "*" {
			return nil, fmt.Errorf("server: %s must not be %q; use the explicit AllowAll option", name, value)
		}
		copied[i] = value
	}

	return copied, nil
}
