package query

import (
	"log/slog"
	"strings"
	"time"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset"
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

	// FunctionAllowlist configures the function names that are allowed in queries.
	// A nil value leaves function calls unrestricted.
	FunctionAllowlist *FunctionAllowlistOptions

	// RejectRemoteURILiterals rejects recognized remote URI literals in reviewed path arguments and replacement scans.
	RejectRemoteURILiterals bool
}

// FunctionAllowlistOptions configures an allowlist from reviewed defaults and exact function names.
type FunctionAllowlistOptions struct {
	// Include adds exact function names to the allowlist.
	Include []string

	// Exclude removes exact function names after defaults and includes are combined.
	Exclude []string

	// DisableDefaults omits the function names returned by functionset.DefaultFunctions.
	DisableDefaults bool
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

// WithFunctionAllowlist allows the reviewed defaults and configured function names in submitted queries.
// Omitting the option leaves function calls unrestricted.
func WithFunctionAllowlist(options FunctionAllowlistOptions) OptionFunc {
	configured := FunctionAllowlistOptions{
		Include:         append([]string(nil), options.Include...),
		Exclude:         append([]string(nil), options.Exclude...),
		DisableDefaults: options.DisableDefaults,
	}
	return func(opts *Options) error {
		value := FunctionAllowlistOptions{
			Include:         append([]string(nil), configured.Include...),
			Exclude:         append([]string(nil), configured.Exclude...),
			DisableDefaults: configured.DisableDefaults,
		}
		opts.FunctionAllowlist = &value
		return nil
	}
}

// WithRemoteURILiteralRejection enables best-effort rejection of recognized remote URI literals in reviewed path
// arguments and replacement scans. Constructed or computed strings may evade detection.
func WithRemoteURILiteralRejection() OptionFunc {
	return func(opts *Options) error {
		opts.RejectRemoteURILiterals = true
		return nil
	}
}

func resolveFunctionAllowlist(options FunctionAllowlistOptions) []string {
	var functions []string
	if !options.DisableDefaults {
		functions = functionset.DefaultFunctions()
	}
	functions = append(functions, options.Include...)

	excluded := make(map[string]struct{}, len(options.Exclude))
	for _, function := range normalizeFunctionNames(options.Exclude) {
		excluded[function] = struct{}{}
	}

	resolved := make([]string, 0, len(functions))
	for _, function := range normalizeFunctionNames(functions) {
		if _, ok := excluded[function]; !ok {
			resolved = append(resolved, function)
		}
	}
	return resolved
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
