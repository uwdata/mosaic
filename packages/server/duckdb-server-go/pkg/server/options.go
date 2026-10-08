package server

import (
	"cmp"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

var (
	errNilOption     = errors.New("server: option must not be nil")
	errNilAuthorizer = errors.New("server: authorizer must not be nil")
)

// CORSOptions configures cross-origin HTTP access. Its zero value grants no
// cross-origin CORS permissions and protects actual command requests with
// net/http CrossOriginProtection. AllowAllOrigins disables that protection.
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

type config struct {
	logger         *slog.Logger
	authorizer     commandAuthorizer
	cors           CORSOptions
	corsProtection *http.CrossOriginProtection
	maxBytes       int64
	cacheControl   string
	varyHeaders    []string
	preaggregate   *preaggregateConfig
}

func defaultConfig() config {
	return config{
		logger:         slog.Default(),
		corsProtection: http.NewCrossOriginProtection(),
	}
}

type Option interface {
	apply(*config) error
}

type optionFunc func(*config) error

func (f optionFunc) apply(cfg *config) error {
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

func WithLogger(logger *slog.Logger) Option {
	return optionFunc(func(cfg *config) error {
		cfg.logger = cmp.Or(logger, slog.Default())
		return nil
	})
}

// WithMaxBytes limits HTTP request bodies to n bytes, which must be
// positive, using http.MaxBytesHandler. The limit applies to every request.
// Omitting it leaves request bodies unbounded.
func WithMaxBytes(n int64) Option {
	return optionFunc(func(cfg *config) error {
		if n <= 0 {
			return errors.New("server: maximum bytes must be positive")
		}
		cfg.maxBytes = n
		return nil
	})
}

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
		protection := http.NewCrossOriginProtection()
		for _, origin := range origins {
			if err := protection.AddTrustedOrigin(origin); err != nil {
				return fmt.Errorf("server: invalid CORS allowed origin %q: %w", origin, err)
			}
		}
		headers, err := copyNonEmpty("CORS allowed header", options.AllowedHeaders, true)
		if err != nil {
			return err
		}

		configured := options
		configured.AllowedOrigins = origins
		configured.AllowedHeaders = headers
		cfg.cors = configured
		if options.AllowAllOrigins {
			cfg.corsProtection = nil
		} else {
			cfg.corsProtection = protection
		}
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
