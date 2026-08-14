package query

import (
	"context"
	"errors"
	"fmt"
	"slices"
	"strings"
)

var (
	ErrAccessDenied = errors.New("query: access denied")

	ErrUnsupportedStatement = errors.New("query: unsupported statement")
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
	details := "query"
	if e.Type != "" {
		details += ": " + e.Type
	}
	if e.Subtype != "" {
		details += " (" + e.Subtype + ")"
	}
	if e.Position != "" {
		details += " at " + e.Position
	}
	if e.Message != "" {
		details += ": " + e.Message
	}
	return details
}

func (e ErrorDetails) Is(target error) bool {
	return target == ErrUnsupportedStatement && strings.EqualFold(e.Type, "not implemented")
}

// ValidateSQL validates the given SQL query using the provided validators
func (db *DB) ValidateSQL(ctx context.Context, sql string, validators ...Validator) error {
	// Qualify the built-in to prevent database macros from shadowing validation.
	serializeSQL := fmt.Sprintf("SELECT system.main.json_serialize_sql(%s, skip_default := true, skip_empty := true, skip_null := true) as ast", quoteLiteral(sql))

	var m map[string]any

	err := db.db.QueryRowContext(ctx, serializeSQL).Scan(&m)
	if err != nil {
		return fmt.Errorf("failed to parse SQL query: %w", err)
	}

	parseError, ok := m["error"].(bool)
	if !ok {
		return errors.New("invalid SQL parser response: missing error status")
	}
	if parseError {
		return ErrorDetails{
			Type:     stringField(m, "error_type"),
			Subtype:  stringField(m, "error_subtype"),
			Message:  stringField(m, "error_message"),
			Position: stringField(m, "position"),
		}
	}

	statements, ok := m["statements"].([]any)
	if !ok {
		return errors.New("invalid SQL parser response: missing or invalid statements")
	}

	// Extract all schema references, including tables without an explicit schema reference, from the AST
	for _, stmt := range statements {
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

func stringField(m map[string]any, key string) string {
	value, _ := m[key].(string)
	return value
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
	if class, exists := node["class"]; exists && (class == "FUNCTION" || class == "WINDOW") {
		v.rejectCatalogReference(node, "catalog")
	}

	val, exists := node["type"]
	if exists {
		switch val {
		case "BASE_TABLE":
			v.handleBaseTable(node)
		case "SHOW_REF":
			v.handleShowRef(node)
		}
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

func (v *baseTableValidator) handleShowRef(showRef map[string]any) {
	if v.rejectCatalogReference(showRef, "catalog_name") {
		return
	}

	// DESCRIBE statements contain a nested query whose base tables are validated separately.
	if _, exists := showRef["query"]; exists {
		return
	}

	schemaName, exists := showRef["schema_name"]
	if !exists {
		v.errs = append(v.errs, fmt.Errorf("%w: SHOW statement requires an explicit authorized schema", ErrAccessDenied))
		return
	}

	schemaNameStr, ok := schemaName.(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("invalid 'schema_name' in show reference, expected string: %v", schemaName))
		return
	}
	schemaNameStr = strings.TrimPrefix(schemaNameStr, "schema_name:")
	if !slices.Contains(v.allowedSchemas, schemaNameStr) {
		v.errs = append(v.errs, fmt.Errorf("%w: unauthorized access to schema '%s'", ErrAccessDenied, schemaNameStr))
	}
}

func (v *baseTableValidator) handleBaseTable(baseTable map[string]any) {
	if v.rejectCatalogReference(baseTable, "catalog_name") {
		return
	}

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

func (v *baseTableValidator) rejectCatalogReference(ref map[string]any, field string) bool {
	catalogName, exists := ref[field]
	if !exists {
		return false
	}

	catalogNameStr, ok := catalogName.(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("invalid '%s', expected string: %v", field, catalogName))
		return true
	}
	catalogNameStr = strings.TrimPrefix(catalogNameStr, field+":")
	v.errs = append(v.errs, fmt.Errorf("%w: access to catalog '%s' is not allowed", ErrAccessDenied, catalogNameStr))
	return true
}

func (v *baseTableValidator) Validate() []error {
	errs := append([]error(nil), v.errs...)

	// Check if all referenced schemas are allowed
	for baseTable := range v.baseTables {
		if baseTable.SchemaName == "" {
			_, ok := v.baseTables[tableRef{TableName: baseTable.TableName, IsCTE: true}]
			if ok {
				continue // empty schemas are allowed if they are CTEs
			}
			errs = append(errs, fmt.Errorf("%w: unauthorized access to table '%s' with empty schema", ErrAccessDenied, baseTable.TableName))
			continue
		}

		if !slices.Contains(v.allowedSchemas, baseTable.SchemaName) {
			errs = append(errs, fmt.Errorf("%w: unauthorized access to schema '%s'", ErrAccessDenied, baseTable.SchemaName))
		}
	}

	return errs
}

// functionBlocklistValidator validates that the SQL query does not use blocked functions.
type functionBlocklistValidator struct {
	blockedFunctions []string
	errs             []error
}

func newFunctionBlocklistValidator(blockedFunctions []string) Validator {
	return &functionBlocklistValidator{
		blockedFunctions: blockedFunctions,
	}
}

func (v *functionBlocklistValidator) CheckNode(node map[string]any, _ []string) {
	class, exists := node["class"]
	if !exists {
		return
	}
	if class != "FUNCTION" && class != "WINDOW" {
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
	functionNameStr = strings.ToLower(functionNameStr)

	if slices.Contains(v.blockedFunctions, functionNameStr) {
		v.errs = append(v.errs, fmt.Errorf("%w: use of function '%s' is not allowed", ErrAccessDenied, functionNameStr))
	}
}

func (v *functionBlocklistValidator) Validate() []error {
	return v.errs
}

type functionAllowlistValidator struct {
	allowedFunctions []string
	errs             []error
}

func newFunctionAllowlistValidator(allowedFunctions []string) Validator {
	return &functionAllowlistValidator{
		allowedFunctions: allowedFunctions,
	}
}

func (v *functionAllowlistValidator) CheckNode(node map[string]any, _ []string) {
	class, exists := node["class"]
	if !exists {
		return
	}
	if class != "FUNCTION" && class != "WINDOW" {
		return
	}

	functionName, exists := node["function_name"]
	if !exists {
		v.errs = append(v.errs, errors.New("query: invalid function node: missing 'function_name'"))
		return
	}

	functionNameStr, ok := functionName.(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("query: invalid 'function_name' in function, expected string: %v", functionName))
		return
	}
	functionNameStr = strings.ToLower(functionNameStr)

	if !slices.Contains(v.allowedFunctions, functionNameStr) {
		v.errs = append(v.errs, fmt.Errorf("%w: function '%s' is not in the allowlist", ErrAccessDenied, functionNameStr))
	}
}

func (v *functionAllowlistValidator) Validate() []error {
	return v.errs
}
