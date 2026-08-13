package query

import (
	"log/slog"
	"strings"
	"time"
)

type Options struct {
	// MaxConnections sets the maximum number of open connections to the database.
	MaxConnections int

	// MaxCacheEntries sets the maximum size of the query result cache.
	MaxCacheEntries int

	// MaxCacheBytes sets the maximum total size in bytes of all entries in the query result cache.
	MaxCacheBytes int

	// TTL sets the time-to-live for cache entries. If zero, entries do not expire.
	TTL time.Duration

	// Logger is the logger to use for logging. If nil, defaults to slog.Default().
	Logger *slog.Logger

	// FunctionBlocklist is a list of function names that are not allowed to be used in queries.
	// This is useful for blocking functions that may pose security or performance risks.
	FunctionBlocklist []string

	// FunctionAllowlist is a list of function names that are allowed to be used in queries.
	// Names are matched exactly and case-insensitively. A non-nil empty list rejects all function calls.
	FunctionAllowlist []string
}

type OptionFunc func(*Options) error

func WithMaxConnections(maxConnections int) OptionFunc {
	return func(opts *Options) error {
		opts.MaxConnections = maxConnections
		return nil
	}
}

func WithMaxCacheEntries(cacheEntries int) OptionFunc {
	return func(opts *Options) error {
		opts.MaxCacheEntries = cacheEntries
		return nil
	}
}

func WithMaxCacheBytes(cacheBytes int) OptionFunc {
	return func(opts *Options) error {
		opts.MaxCacheBytes = cacheBytes
		return nil
	}
}

func WithTTL(ttl time.Duration) OptionFunc {
	return func(opts *Options) error {
		opts.TTL = ttl
		return nil
	}
}

func WithLogger(logger *slog.Logger) OptionFunc {
	return func(opts *Options) error {
		opts.Logger = logger
		return nil
	}
}

func WithFunctionBlocklist(blockedFunctions []string) OptionFunc {
	return func(opts *Options) error {
		opts.FunctionBlocklist = normalizeFunctionNames(blockedFunctions)
		return nil
	}
}

// WithFunctionAllowlist allows only the named functions in submitted queries.
// Passing nil or an empty slice denies all function calls; omitting the option leaves function calls unrestricted.
func WithFunctionAllowlist(allowedFunctions []string) OptionFunc {
	return func(opts *Options) error {
		opts.FunctionAllowlist = normalizeFunctionNames(allowedFunctions)
		return nil
	}
}

func normalizeFunctionNames(functions []string) []string {
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
