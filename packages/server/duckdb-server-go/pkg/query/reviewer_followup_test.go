package query

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestReviewerTemporaryRead(t *testing.T) {
	db := setupTestDB(t, true, WithValidation(), WithMaxConnections(1))
	_, err := db.db.ExecContext(t.Context(), `CREATE TEMP TABLE source AS SELECT 42 AS x`)
	require.NoError(t, err)
	p, err := NewPreAggregator(t.Context(), db, nil)
	require.NoError(t, err)
	data, err := p.Query(t.Context(), reader, `SELECT * FROM temp.main.source`, nil, nil)
	require.NoError(t, err)
	require.Equal(t, []map[string]any{{"x": float64(42)}}, arrowRows(t, data))
}

func TestReviewerUnicodeNamespaces(t *testing.T) {
	db, p := setupPreAggregator(t)
	source := `SELECT * FROM memory.tenant.source`
	first, err := p.Materialize(t.Context(), Namespace{Schema: []string{"Ä"}}, source, nil)
	require.NoError(t, err)
	_, err = db.db.ExecContext(t.Context(), `DELETE FROM memory.tenant.source`)
	require.NoError(t, err)
	second, err := p.Materialize(t.Context(), Namespace{Schema: []string{"ä"}}, source, nil)
	require.NoError(t, err)
	require.Equal(t, int64(0), second.Rows)
	require.NotEqual(t, first.Reference.Schema, second.Reference.Schema)
}
