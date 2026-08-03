package server

import (
	"testing"

	"github.com/duckdb/duckdb-go/v2"
	"github.com/stretchr/testify/require"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/internal/query"
)

func TestExecCommandHonorsSchemaPolicy(t *testing.T) {
	connector, err := duckdb.NewConnector(":memory:", nil)
	require.NoError(t, err)

	db, err := query.New(t.Context(), connector)
	require.NoError(t, err)
	t.Cleanup(func() {
		db.Close()
		require.NoError(t, connector.Close())
	})

	command := CommandExec
	sql := "SELECT 1"
	params := QueryParams{Type: &command, SQL: &sql}

	s := New(db, []string{"X-Tenant"}, nil)
	_, _, err = s.execCommand(t.Context(), params, nil)
	require.ErrorIs(t, err, query.ErrExecWithValidation)

	s = New(db, nil, nil)
	_, _, err = s.execCommand(t.Context(), params, nil)
	require.NoError(t, err)
}
