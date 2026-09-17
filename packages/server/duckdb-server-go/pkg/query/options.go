package query

import (
	"log/slog"
	"strings"
)

type Options struct {
	// MaxConnections sets the maximum number of open connections to the database.
	MaxConnections int

	// Logger is the logger to use for logging. If nil, defaults to slog.Default().
	Logger *slog.Logger

	// Validation validates every Arrow query through Gatekeeper, even when the caller supplies no request policy,
	// disables Exec, and makes New fail when Gatekeeper is not loaded.
	Validation bool
}

type OptionFunc func(*Options) error

func WithMaxConnections(maxConnections int) OptionFunc {
	return func(opts *Options) error {
		opts.MaxConnections = maxConnections
		return nil
	}
}

func WithLogger(logger *slog.Logger) OptionFunc {
	return func(opts *Options) error {
		opts.Logger = logger
		return nil
	}
}

// WithValidation validates every Arrow query, even without a request policy, and disables Exec. Function policy is
// expected to come from the database-wide gatekeeper_configure ceiling set during trusted initialization; request
// policies can only narrow it. New fails when Gatekeeper is not loaded.
func WithValidation() OptionFunc {
	return func(opts *Options) error {
		opts.Validation = true
		return nil
	}
}

// NormalizeFunctionNames lowercases, trims, and deduplicates function names. Gatekeeper matches configured names
// exactly, so the same normalization must be applied to gatekeeper_configure arguments and to ValidationPolicy.
func NormalizeFunctionNames(functions []string) []string {
	normalized := make([]string, 0, len(functions))
	seen := make(map[string]struct{}, len(functions))
	for _, function := range functions {
		function = strings.ToLower(strings.TrimSpace(function))
		if function != "" {
			if _, ok := seen[function]; ok {
				continue
			}
			seen[function] = struct{}{}
			normalized = append(normalized, function)
		}
	}
	return normalized
}
