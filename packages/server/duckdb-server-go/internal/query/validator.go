package query

import (
	"context"
	"fmt"
	"slices"
	"strings"
)

type ErrorDetails struct {
	Type     string `json:"error_type"`
	Subtype  string `json:"error_subtype"`
	Message  string `json:"error_message"`
	Position string `json:"position"`
}

func (e ErrorDetails) Error() string {
	return fmt.Sprintf("query: %s (%s) at %s: %s", e.Type, e.Subtype, e.Position, e.Message)
}

// ValidateSQL validates that the SQL query only accesses schemas that match the request headers
func (db *DB) ValidateSQL(ctx context.Context, sql string, allowedSchemas []string) error {
	// Use json_serialize_sql to parse the SQL and extract schema references
	// serializeSQL := fmt.Sprintf("SELECT json_serialize_sql(%s) as ast", quoteLiteral(sql))
	serializeSQL := fmt.Sprintf("SELECT json_serialize_sql(%s, skip_default := true, skip_empty := true, skip_null := true) as ast", quoteLiteral(sql))

	var m map[string]any

	err := db.db.QueryRowContext(ctx, serializeSQL).Scan(&m)
	if err != nil {
		return fmt.Errorf("failed to parse SQL query: %w", err)
	}

	if m["error"].(bool) {
		return ErrorDetails{
			Type:     m["error_type"].(string),
			Subtype:  m["error_subtype"].(string),
			Message:  m["error_message"].(string),
			Position: m["position"].(string),
		}
	}

	// Extract all schema references, including tables without an explicit schema reference, from the AST
	baseTables, err := extractBaseTables(m["statements"].([]any))
	if err != nil {
		return fmt.Errorf("failed to analyze SQL query: %w", err)
	}

	// Check if all referenced schemas are allowed
	for baseTable := range baseTables {
		if baseTable.SchemaName == "" {
			_, ok := baseTables[tableRef{TableName: baseTable.TableName, IsCTE: true}]
			if ok {
				continue // empty schemas are allowed if they are CTEs
			} else {
				return fmt.Errorf("access denied: unauthorized access to table '%v' with empty schema", baseTable.TableName)
			}
		}

		if !slices.Contains(allowedSchemas, baseTable.SchemaName) {
			return fmt.Errorf("access denied: unauthorized access to schema '%v'", baseTable)
		}
	}

	return nil
}

type tableRef struct {
	SchemaName string `json:"schema_name"`
	TableName  string `json:"table_name"`
	IsCTE      bool   `json:"is_cte,omitempty"`
}

// extractBaseTables recursively walks the AST to find all schema references
func extractBaseTables(stmts []any) (map[tableRef]struct{}, error) {
	baseTables := make(map[tableRef]struct{})

	for _, stmt := range stmts {
		stmtMap, ok := stmt.(map[string]any)
		if !ok {
			return nil, fmt.Errorf("invalid statement format: %v", stmt)
		}

		keyStack := make([]string, 0, 10)

		err := walkAST(stmtMap, keyStack, baseTables)
		if err != nil {
			return nil, err
		}
	}

	return baseTables, nil
}

func walkASTSlice(nodes []any, keyStack []string, baseTables map[tableRef]struct{}) error {
	for _, node := range nodes {
		switch typedNode := node.(type) {
		case map[string]any:
			err := walkAST(typedNode, keyStack, baseTables)
			if err != nil {
				return err
			}

		case []any:
			err := walkASTSlice(typedNode, keyStack, baseTables)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func walkAST(node map[string]any, keyStack []string, baseTables map[tableRef]struct{}) error {
	for key, val := range node {
		if key == "type" && val == "BASE_TABLE" {
			err := handleBaseTable(node, baseTables)
			if err != nil {
				return err
			}
		}

		if key == "key" && len(keyStack) >= 2 && keyStack[len(keyStack)-2] == "cte_map" && keyStack[len(keyStack)-1] == "map" {
			baseTables[tableRef{
				TableName: val.(string),
				IsCTE:     true,
			}] = struct{}{}
		}

		switch typedVal := val.(type) {
		case map[string]any:
			err := walkAST(typedVal, append(keyStack, key), baseTables)
			if err != nil {
				return err
			}

		case []any:
			err := walkASTSlice(typedVal, append(keyStack, key), baseTables)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

func handleBaseTable(baseTable map[string]any, baseTables map[tableRef]struct{}) error {
	var schemaNameStr string
	schemaName, exists := baseTable["schema_name"]
	if exists {
		var ok bool
		schemaNameStr, ok = schemaName.(string)
		if !ok {
			return fmt.Errorf("invalid 'schema_name' in from_table, expected string: %v", schemaName)
		}
	}

	tableName := baseTable["table_name"]
	tableNameStr, ok := tableName.(string)
	if !ok {
		return fmt.Errorf("invalid 'table_name' in from_table, expected string: %v", tableName)
	}

	// purposefully include empty schemas. We can reject them later if needed
	baseTables[tableRef{
		SchemaName: strings.TrimPrefix(schemaNameStr, "schema_name:"),
		TableName:  tableNameStr,
	}] = struct{}{}

	return nil
}

// quoteLiteral properly escapes a string for use as a SQL string literal
func quoteLiteral(s string) string {
	// Escape single quotes by doubling them
	escaped := strings.ReplaceAll(s, "'", "''")
	return "'" + escaped + "'"
}
