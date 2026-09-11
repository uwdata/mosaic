package query

import (
	"errors"
	"fmt"
	"slices"
	"strings"

	"github.com/uwdata/mosaic/packages/server/duckdb-server-go/pkg/functionset/remoteread"
)

// Sources are the DuckDB 1.5.5-pinned filesystem handlers listed in ../functionset/remoteread/README.md.
var remoteURIPrefixes = [...]string{
	"http://",
	"https://",
	"s3://",
	"s3a://",
	"s3n://",
	"gcs://",
	"gs://",
	"r2://",
	"hf://",
	"azure://",
	"az://",
	"abfs://",
	"abfss://",
}

var nestedSQLTableExecutors = [...]string{
	"json_execute_serialized_sql",
	"query",
}

const nestedSQLScalarExecutor = "json_serialize_plan"

type remoteURILiteralValidator struct {
	errs []error
}

func newRemoteURILiteralValidator() Validator {
	return &remoteURILiteralValidator{}
}

func (v *remoteURILiteralValidator) CheckNode(node map[string]any, keyStack []string) {
	if node["class"] == "FUNCTION" && (len(keyStack) == 0 || keyStack[len(keyStack)-1] != "function") {
		v.checkScalarNestedSQLExecutor(node)
	}

	switch node["type"] {
	case "BASE_TABLE":
		v.checkBaseTable(node)
	case "TABLE_FUNCTION":
		v.checkTableFunction(node)
	}
}

func (v *remoteURILiteralValidator) checkScalarNestedSQLExecutor(node map[string]any) {
	functionName, ok := node["function_name"].(string)
	if !ok || !strings.EqualFold(functionName, nestedSQLScalarExecutor) {
		return
	}
	if catalog := stringField(node, "catalog"); catalog != "" && !strings.EqualFold(catalog, "system") {
		return
	}
	if schema := stringField(node, "schema"); schema != "" &&
		!strings.EqualFold(schema, "main") && !strings.EqualFold(schema, "system") {
		return
	}
	v.errs = append(v.errs, fmt.Errorf("%w: nested SQL executor '%s' is not allowed", ErrAccessDenied, nestedSQLScalarExecutor))
}

func (v *remoteURILiteralValidator) checkBaseTable(node map[string]any) {
	tableName, ok := node["table_name"].(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("query: invalid remote URI base table node: expected string table_name: %v", node["table_name"]))
		return
	}
	if prefix, ok := findRemoteURIPrefix(tableName); ok {
		v.reject(prefix, "replacement scan")
	}
}

func (v *remoteURILiteralValidator) checkTableFunction(node map[string]any) {
	function, ok := node["function"].(map[string]any)
	if !ok {
		v.errs = append(v.errs, errors.New("query: invalid remote URI table function node: missing function"))
		return
	}

	functionName, ok := function["function_name"].(string)
	if !ok {
		v.errs = append(v.errs, fmt.Errorf("query: invalid remote URI table function node: expected string function_name: %v", function["function_name"]))
		return
	}
	functionName = strings.ToLower(functionName)
	if slices.Contains(nestedSQLTableExecutors[:], functionName) {
		v.errs = append(v.errs, fmt.Errorf("%w: nested SQL executor '%s' is not allowed", ErrAccessDenied, functionName))
		return
	}

	pathArguments, ok := remoteread.Lookup(functionName)
	if !ok {
		return
	}

	children, ok := function["children"].([]any)
	if !ok {
		return
	}

	positional := 0
	for _, child := range children {
		argument, ok := child.(map[string]any)
		if !ok {
			continue
		}

		if name, named := argument["alias"].(string); named && name != "" {
			if slices.Contains(pathArguments.Named, strings.ToLower(name)) {
				v.checkPathExpression(argument, functionName)
			}
			continue
		}

		if slices.Contains(pathArguments.Positional, positional) {
			v.checkPathExpression(argument, functionName)
		}
		positional++
	}
}

func (v *remoteURILiteralValidator) checkPathExpression(expression map[string]any, functionName string) {
	walkValues(expression, func(node map[string]any) {
		if node["class"] != "CONSTANT" {
			return
		}
		value, ok := node["value"].(map[string]any)
		if !ok {
			return
		}
		literal, ok := value["value"].(string)
		if !ok {
			return
		}
		if prefix, ok := findRemoteURIPrefix(literal); ok {
			v.reject(prefix, fmt.Sprintf("path argument to function '%s'", strings.ToLower(functionName)))
		}
	})
}

func (v *remoteURILiteralValidator) reject(prefix, location string) {
	v.errs = append(v.errs, fmt.Errorf("%w: remote URI prefix '%s' is not allowed in %s", ErrAccessDenied, prefix, location))
}

func (v *remoteURILiteralValidator) Validate() []error {
	return append([]error(nil), v.errs...)
}

func findRemoteURIPrefix(value string) (string, bool) {
	value = strings.ToLower(value)
	for _, prefix := range remoteURIPrefixes {
		if strings.Contains(value, prefix) {
			return prefix, true
		}
	}
	return "", false
}

func walkValues(value any, visit func(map[string]any)) {
	switch value := value.(type) {
	case map[string]any:
		visit(value)
		for _, child := range value {
			walkValues(child, visit)
		}
	case []any:
		for _, child := range value {
			walkValues(child, visit)
		}
	}
}
