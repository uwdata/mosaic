package query

import (
	"log/slog"
	"strings"
)

type Options struct {
	GatekeeperExtension string
	// MaxConnections sets the maximum number of open connections to the database.
	MaxConnections int

	// Logger is the logger to use for logging. If nil, defaults to slog.Default().
	Logger *slog.Logger

	// FunctionBlocklist is a list of function names that are not allowed to be used in queries.
	// This is useful for blocking functions that may pose security or performance risks.
	FunctionBlocklist []string

	// FunctionAllowlist configures the function names that are allowed in queries.
	// A nil value uses Gatekeeper's defaults when validation is active.
	FunctionAllowlist *FunctionAllowlistOptions

	// Deprecated: Gatekeeper does not implement reader-argument policies. Configuring this fails initialization.
	RejectRemoteURILiterals bool
}

// FunctionAllowlistOptions configures an allowlist from reviewed defaults and exact function names.
type FunctionAllowlistOptions struct {
	// Include adds exact function names to the allowlist.
	Include []string

	// Exclude removes exact function names after defaults and includes are combined.
	Exclude []string

	// DisableDefaults omits Gatekeeper's reviewed function defaults.
	DisableDefaults bool
}

type OptionFunc func(*Options) error

func WithGatekeeperExtension(path string) OptionFunc {
	return func(opts *Options) error { opts.GatekeeperExtension = path; return nil }
}

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

func WithFunctionBlocklist(blockedFunctions []string) OptionFunc {
	return func(opts *Options) error {
		opts.FunctionBlocklist = normalizeFunctionNames(blockedFunctions)
		return nil
	}
}

// WithFunctionAllowlist allows the reviewed defaults and configured function names in submitted queries.
// Omitting the option uses Gatekeeper's defaults when validation is active.
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

// Deprecated: Gatekeeper does not implement reader-argument policies. Configuring this fails initialization.
func WithRemoteURILiteralRejection() OptionFunc {
	return func(opts *Options) error {
		opts.RejectRemoteURILiterals = true
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
