package query

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
)

type Validator interface {
	// CheckNode is called once for each node in the AST
	// - node: the current node being processed
	// - keyStack: contains the stack of keys leading to this node, with the root being the first element,
	//   and the parent key being the last element
	//
	// This explicitly does not not return an error. Any errors found should be collected and returned
	// in the Validate() method.
	CheckNode(node map[string]any, keyStack []string)

	// Validate is called after the entire AST has been processed. It should return any errors found during
	// the CheckNode calls, or any additional validation errors that can only be determined after
	// processing the entire AST. This allows validators to collect state during the AST traversal and perform more
	// complex validation that may depend on multiple nodes or the overall structure of the AST.
	//
	// It returns a slice of errors, to encourage collecting all errors rather than stopping at the first one.
	// If no errors are found, it should return nil.
	Validate() []error
}

type ErrorDetails struct {
	Type     string `json:"error_type"`
	Subtype  string `json:"error_subtype"`
	Message  string `json:"error_message"`
	Position string `json:"position"`
}

func (e ErrorDetails) Error() string {
	return fmt.Sprintf("query: %s (%s) at %s: %s", e.Type, e.Subtype, e.Position, e.Message)
}

// ValidateSQL validates the given SQL query using the provided validators
func (db *DB) ValidateSQL(ctx context.Context, sql string, validators ...Validator) error {
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
	for _, stmt := range m["statements"].([]any) {
		stmtMap, ok := stmt.(map[string]any)
		if !ok {
			return fmt.Errorf("invalid statement format: %v", stmt)
		}

		keyStack := make([]string, 0, 10)

		walkAST(stmtMap, keyStack, validators)
	}

	var combinedErrs []error

	for _, validator := range validators {
		validationErrs := validator.Validate()
		if len(validationErrs) > 0 {
			combinedErrs = append(combinedErrs, validationErrs...)
		}
	}

	return errors.Join(combinedErrs...)
}

// quoteLiteral properly escapes a string for use as a SQL string literal
func quoteLiteral(s string) string {
	// Escape single quotes by doubling them
	escaped := strings.ReplaceAll(s, "'", "''")
	return "'" + escaped + "'"
}

func walkASTSlice(nodes []any, keyStack []string, validators []Validator) {
	for _, node := range nodes {
		switch typedNode := node.(type) {
		case map[string]any:
			walkAST(typedNode, keyStack, validators)

		case []any:
			walkASTSlice(typedNode, keyStack, validators)
		}
	}
}

func walkAST(node map[string]any, keyStack []string, validators []Validator) {
	for _, validator := range validators {
		validator.CheckNode(node, keyStack)
	}

	for key, val := range node {
		switch typedVal := val.(type) {
		case map[string]any:
			walkAST(typedVal, append(keyStack, key), validators)

		case []any:
			walkASTSlice(typedVal, append(keyStack, key), validators)
		}
	}
}

// baseTableValidator validates that the SQL query only accesses schemas that match request headers
type baseTableValidator struct {
	allowedSchemas []string
	baseTables     map[tableRef]struct{}
	errs           []error
}

type tableRef struct {
	SchemaName string `json:"schema_name"`
	TableName  string `json:"table_name"`
	IsCTE      bool   `json:"is_cte,omitempty"`
}

func newBaseTableValidator(allowedSchemas []string) Validator {
	return &baseTableValidator{
		allowedSchemas: allowedSchemas,
		baseTables:     make(map[tableRef]struct{}),
	}
}

func (v *baseTableValidator) CheckNode(node map[string]any, keyStack []string) {
	val, exists := node["type"]
	if exists && val == "BASE_TABLE" {
		v.handleBaseTable(node)
	}

	if len(keyStack) >= 2 && keyStack[len(keyStack)-2] == "cte_map" && keyStack[len(keyStack)-1] == "map" {
		val, exists = node["key"]
		if exists {
			v.baseTables[tableRef{
				TableName: val.(string),
				IsCTE:     true,
			}] = struct{}{}
		}
	}
}

func (v *baseTableValidator) handleBaseTable(baseTable map[string]any) {
	var schemaNameStr string
	schemaName, exists := baseTable["schema_name"]
	if exists {
		var ok bool
		schemaNameStr, ok = schemaName.(string)
		if !ok {
			v.errs = append(v.errs, fmt.Errorf("invalid 'schema_name' in from_table, expected string: %v", schemaName))
			return
		}
	}

	tableName := baseTable["table_name"]
	tableNameStr, ok := tableName.(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("invalid 'table_name' in from_table, expected string: %v", tableName))
		return
	}

	// purposefully include empty schemas. We can reject them later if needed
	v.baseTables[tableRef{
		SchemaName: strings.TrimPrefix(schemaNameStr, "schema_name:"),
		TableName:  tableNameStr,
	}] = struct{}{}
}

func (v *baseTableValidator) Validate() []error {
	var errs []error

	// Check if all referenced schemas are allowed
	for baseTable := range v.baseTables {
		if baseTable.SchemaName == "" {
			_, ok := v.baseTables[tableRef{TableName: baseTable.TableName, IsCTE: true}]
			if ok {
				continue // empty schemas are allowed if they are CTEs
			} else {
				errs = append(errs, fmt.Errorf("access denied: unauthorized access to table '%v' with empty schema", baseTable.TableName))
			}
		}

		if !slices.Contains(v.allowedSchemas, baseTable.SchemaName) {
			errs = append(errs, fmt.Errorf("access denied: unauthorized access to schema '%v'", baseTable))
		}
	}

	return errs
}

// functionBlocklistValidator validates that the SQL query only accesses schemas that match request headers
type functionBlocklistValidator struct {
	blockedFunctions []string
	errs             []error
}

func newFunctionBlocklistValidator(blockedFunctions []string) Validator {
	return &functionBlocklistValidator{
		blockedFunctions: blockedFunctions,
	}
}

func (v *functionBlocklistValidator) CheckNode(node map[string]any, keyStack []string) {
	if len(keyStack) > 0 && keyStack[len(keyStack)-1] != "function" {
		return
	}

	class, exists := node["class"]
	if !exists {
		return
	}
	if class != "FUNCTION" {
		return
	}

	typeVal, exists := node["type"]
	if !exists {
		return
	}
	if typeVal != "FUNCTION" {
		return
	}

	functionName, exists := node["function_name"]
	if !exists {
		return
	}

	functionNameStr, ok := functionName.(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("query: invalid 'function_name' in function, expected string: %v", functionName))
		return
	}

	if slices.Contains(v.blockedFunctions, functionNameStr) {
		v.errs = append(v.errs, fmt.Errorf("query: access denied: use of function '%s' is not allowed", functionNameStr))
	}
}

func (v *functionBlocklistValidator) Validate() []error {
	return v.errs
}
