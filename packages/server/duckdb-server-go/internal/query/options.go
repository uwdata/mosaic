package query

import (
	"log/slog"
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
