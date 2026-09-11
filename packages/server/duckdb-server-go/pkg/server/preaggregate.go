package server

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

var errUnsupportedCommand = errors.New("server: unsupported command")

type PreAggregateOptions struct {
	Catalog string
	Limits  query.PreAggregateLimits
	Scope   func(context.Context) (query.PreAggregateScope, error)
}

func WithPreaggregation(options PreAggregateOptions) Option {
	return optionFunc(func(cfg *config) error {
		if options.Scope == nil {
			return errors.New("server: preaggregation scope resolver is required")
		}
		configured := options
		cfg.preaggregate = &configured
		return nil
	})
}

func (s *handler) queryPreaggregate(ctx context.Context, params queryParams, authorize commandAuthorizer) ([]byte, error) {
	scope, err := s.preaggregateScope(ctx)
	if err != nil {
		return nil, &authorizationError{err: err}
	}
	if *params.Type == CommandPreagg {
		table, err := s.preaggregator.Materialize(ctx, scope, *params.SQL)
		if err != nil {
			return nil, err
		}
		return json.Marshal(table)
	}
	return s.preaggregator.QueryArrow(ctx, scope, *params.SQL, func(ctx context.Context, sql string) error {
		if authorize != nil {
			typ := CommandPreagg
			if err := authorize(ctx, queryParams{Type: &typ, SQL: &sql, raw: params.raw}); err != nil {
				return &authorizationError{err: err}
			}
		}
		return nil
	})
}
