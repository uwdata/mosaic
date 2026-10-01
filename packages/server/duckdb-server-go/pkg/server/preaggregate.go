package server

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
)

// PreAggregateOptions configures server-owned preaggregation. T is the application payload type decoded from each
// command envelope, as in WithAuthorizer.
type PreAggregateOptions[T any] struct {
	// Materializer chooses the physical form of managed tables; nil uses query.TableMaterializer.
	Materializer query.Materializer
	// Namespace returns the catalog and schema this caller's tables live in; nil uses the "mosaic_preagg" schema of
	// the current catalog for everyone. HTTP GET commands carry the zero value of T.
	Namespace func(context.Context, Command[T]) (query.Namespace, error)
}

type preaggregateConfig struct {
	materializer query.Materializer
	namespace    func(context.Context, queryParams) (query.Namespace, error)
}

func WithPreaggregation[T any](options PreAggregateOptions[T]) Option {
	return optionFunc(func(cfg *config) error {
		cfg.preaggregate = &preaggregateConfig{
			materializer: options.Materializer,
			namespace: func(ctx context.Context, params queryParams) (query.Namespace, error) {
				if options.Namespace == nil {
					return query.Namespace{Schema: []string{"mosaic_preagg"}}, nil
				}
				command, err := decodeCommand[T](params)
				if err != nil {
					return query.Namespace{}, err
				}
				return options.Namespace(ctx, command)
			},
		}
		return nil
	})
}

func (s *handler) queryPreaggregate(r *http.Request, params queryParams, policy *query.ValidationPolicy) ([]byte, error) {
	ctx := r.Context()
	ns, err := s.preaggregateNamespace(ctx, params)
	if err != nil {
		return nil, err
	}
	if *params.Type == CommandPreagg {
		table, err := s.preaggregator.Materialize(ctx, ns, *params.SQL, policy)
		if err != nil {
			return nil, err
		}
		return json.Marshal(table)
	}
	var sourcePolicy query.SourcePolicy
	if s.authorizer != nil {
		sourcePolicy = func(_ context.Context, sql string) (*query.ValidationPolicy, error) {
			typ := CommandPreagg
			return s.authorizer(r, queryParams{Type: &typ, SQL: &sql, raw: params.raw})
		}
	}
	return s.preaggregator.Query(ctx, ns, *params.SQL, policy, sourcePolicy)
}
