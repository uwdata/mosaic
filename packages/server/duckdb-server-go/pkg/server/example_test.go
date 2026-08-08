package server_test

import (
	"context"
	"net/http"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/query"
	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/server"
)

type identityKey struct{}

func ExampleNew() {
	// The embedding application owns construction and shutdown of the query DB.
	// Callers must supply a real *query.DB; nil is illustrative only.
	var db *query.DB

	authorizer := server.AuthorizerFunc(func(r *http.Request) (server.CommandAuthorizer, error) {
		identity, ok := r.Context().Value(identityKey{}).(string)
		if !ok {
			return nil, server.ErrUnauthenticated
		}

		return func(ctx context.Context, command server.Command) error {
			if err := ctx.Err(); err != nil {
				return err
			}
			if identity != "reader" || command.Type() == server.CommandExec {
				return server.ErrPermissionDenied
			}
			return nil
		}, nil
	})

	handler, err := server.New(db, server.WithAuthorizer(authorizer))
	if err != nil {
		panic(err)
	}

	// Ordinary authentication remains outer HTTP middleware. It can place a
	// verified identity in the request context for the Authorizer to inspect.
	authenticate := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("Authorization") == "" {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), identityKey{}, "reader")
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}

	_ = authenticate(handler)
}
