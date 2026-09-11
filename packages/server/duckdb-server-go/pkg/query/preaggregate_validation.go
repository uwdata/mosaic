package query

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset"
)

func (p *PreAggregator) validate(ctx context.Context, scope PreAggregateScope, sql string, materialize bool) ([]preAggregateRef, error) {
	if scope.Key == "" {
		return nil, errors.New("query: preaggregation scope key is required")
	}
	for _, source := range scope.Sources {
		catalog, schema := strings.ToLower(source.Catalog), strings.ToLower(source.Schema)
		if catalog == "" || schema == "" || catalog == "temp" || catalog == "system" || schema == "information_schema" || schema == "pg_catalog" || strings.ContainsRune(catalog+schema, 0) || strings.HasPrefix(schema, "mosaic_preagg_") {
			return nil, errors.New("query: invalid preaggregation source namespace")
		}
	}
	if len(sql) > 1<<20 {
		return nil, ErrPreAggregateLimit
	}
	statements, err := p.db.parseSQL(ctx, sql)
	if err != nil {
		return nil, err
	}
	if len(statements) != 1 {
		return nil, ErrUnsupportedStatement
	}
	validators := append(p.db.queryValidators(nil),
		newFunctionAllowlistValidator(functionset.DefaultFunctions()),
		&preAggregateValidator{materialize: materialize},
	)
	if err := validateStatements(statements, validators); err != nil {
		return nil, err
	}
	var refs []preAggregateRef
	if err := preAggregateReferences(statements, nil, &refs); err != nil {
		return nil, err
	}
	var managed []preAggregateRef
	for _, ref := range refs {
		if strings.HasPrefix(strings.ToLower(ref.schema), "mosaic_preagg_") {
			if materialize || ref.catalog != p.catalog || ref.schema != p.reference(scope.Key, "").schema || !validPreAggregateName(ref.table) {
				return nil, ErrAccessDenied
			}
			managed = append(managed, ref)
		} else if !slices.Contains(scope.Sources, PreAggregateNamespace{ref.catalog, ref.schema}) {
			return nil, ErrAccessDenied
		}
	}
	return managed, nil
}

func preAggregateReferences(value any, ctes map[string]bool, refs *[]preAggregateRef) error {
	switch node := value.(type) {
	case []any:
		for _, child := range node {
			if err := preAggregateReferences(child, ctes, refs); err != nil {
				return err
			}
		}
	case map[string]any:
		if stringField(node, "type") == "RECURSIVE_CTE_NODE" {
			return ErrUnsupportedStatement
		}
		if cteMap, ok := node["cte_map"].(map[string]any); ok {
			local := make(map[string]bool, len(ctes))
			for name := range ctes {
				local[name] = true
			}
			entries, _ := cteMap["map"].([]any)
			for _, entry := range entries {
				cte, ok := entry.(map[string]any)
				if !ok || stringField(cte, "key") == "" {
					return ErrUnsupportedStatement
				}
				name := foldPreAggregateIdentifier(stringField(cte, "key"))
				delete(local, name)
				if err := preAggregateReferences(cte["value"], local, refs); err != nil {
					return err
				}
				local[name] = true
			}
			ctes = local
		}
		if stringField(node, "type") == "BASE_TABLE" {
			ref := preAggregateRef{stringField(node, "catalog_name"), stringField(node, "schema_name"), stringField(node, "table_name")}
			if ref.catalog == "" && ref.schema == "" && ctes[foldPreAggregateIdentifier(ref.table)] {
				return nil
			}
			// Two-part DuckDB names can bind as either schema.table or catalog.table.
			if ref.catalog == "" || ref.schema == "" || ref.table == "" {
				return ErrAccessDenied
			}
			*refs = append(*refs, ref)
		}
		for key, child := range node {
			if key != "cte_map" {
				if err := preAggregateReferences(child, ctes, refs); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func foldPreAggregateIdentifier(name string) string {
	return strings.Map(func(ch rune) rune {
		if ch >= 'A' && ch <= 'Z' {
			return ch + 'a' - 'A'
		}
		return ch
	}, name)
}

func validPreAggregateName(name string) bool {
	if len(name) != len("preagg_")+64 || !strings.HasPrefix(name, "preagg_") {
		return false
	}
	for _, ch := range strings.TrimPrefix(name, "preagg_") {
		if !(ch >= '0' && ch <= '9' || ch >= 'a' && ch <= 'f') {
			return false
		}
	}
	return true
}

type preAggregateValidator struct {
	materialize bool
	errs        []error
}

func (v *preAggregateValidator) CheckNode(node map[string]any, _ []string) {
	if stringField(node, "class") == "PARAMETER" || v.materialize && stringField(node, "type") == "SHOW_REF" {
		v.errs = append(v.errs, ErrUnsupportedStatement)
	}
	if stringField(node, "type") == "SHOW_REF" && node["query"] == nil {
		v.errs = append(v.errs, ErrAccessDenied)
	}
	if class := stringField(node, "class"); class == "FUNCTION" || class == "WINDOW" {
		catalog, schema := stringField(node, "catalog"), stringField(node, "schema")
		if catalog != "" && catalog != "system" || schema != "" && schema != "main" {
			v.errs = append(v.errs, fmt.Errorf("%w: qualified function is not allowed", ErrAccessDenied))
		}
	}
}

func (v *preAggregateValidator) Validate() []error {
	return v.errs
}
