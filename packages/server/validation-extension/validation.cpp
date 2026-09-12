#define DUCKDB_EXTENSION_NAME mosaic_validation
#include "duckdb_extension.h"
#include "yyjson.h"
#include "grammar.hpp"

DUCKDB_EXTENSION_EXTERN

#include <algorithm>
#include <map>
#include <memory>
#include <set>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

using Json = yyjson_val;
using Doc = std::unique_ptr<yyjson_doc, decltype(&yyjson_doc_free)>;
using Names = std::set<std::string>;

static std::string Text(Json *value) {
    if (!yyjson_is_str(value)) return {};
    return std::string(yyjson_get_str(value), yyjson_get_len(value));
}

static std::string Field(Json *value, const char *key) {
    return Text(yyjson_obj_get(value, key));
}

static std::string Lower(std::string value) {
    for (auto &c : value) if (c >= 'A' && c <= 'Z') c += 'a' - 'A';
    return value;
}

static Doc Parse(const std::string &text) {
    yyjson_read_err error;
    auto doc = yyjson_read_opts(const_cast<char *>(text.data()), text.size(), 0, nullptr, &error);
    if (!doc) throw std::runtime_error("invalid JSON input");
    return Doc(doc, yyjson_doc_free);
}

static Names StringList(Json *value) {
    if (!yyjson_is_arr(value)) throw std::runtime_error("expected string array");
    Names result;
    size_t i, max;
    Json *item;
    yyjson_arr_foreach(value, i, max, item) {
        if (!yyjson_is_str(item)) throw std::runtime_error("expected string array member");
        result.insert(Text(item));
    }
    return result;
}

struct Rule {
    std::unordered_map<std::string, std::string> fields;
    Names required;
};

struct Grammar {
    std::unordered_map<std::string, Rule> rules;
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> dispatch;
    std::unordered_map<std::string, Names> expression_types = {
        {"BETWEEN", {"COMPARE_BETWEEN", "COMPARE_NOT_BETWEEN"}},
        {"CASE", {"CASE_EXPR"}}, {"CAST", {"OPERATOR_CAST"}}, {"COLLATE", {"COLLATE"}},
        {"COLUMN_REF", {"COLUMN_REF"}},
        {"COMPARISON", {"COMPARE_EQUAL", "COMPARE_NOTEQUAL", "COMPARE_LESSTHAN", "COMPARE_GREATERTHAN", "COMPARE_LESSTHANOREQUALTO", "COMPARE_GREATERTHANOREQUALTO", "COMPARE_DISTINCT_FROM", "COMPARE_NOT_DISTINCT_FROM"}},
        {"CONJUNCTION", {"CONJUNCTION_AND", "CONJUNCTION_OR"}}, {"CONSTANT", {"VALUE_CONSTANT"}},
        {"FUNCTION", {"FUNCTION"}}, {"LAMBDA", {"LAMBDA"}},
        {"OPERATOR", {"OPERATOR_NOT", "OPERATOR_IS_NULL", "OPERATOR_IS_NOT_NULL", "OPERATOR_UNPACK", "COMPARE_IN", "COMPARE_NOT_IN", "GROUPING_FUNCTION", "OPERATOR_COALESCE", "ARRAY_EXTRACT", "ARRAY_SLICE", "STRUCT_EXTRACT", "ARRAY_CONSTRUCTOR", "ARROW", "OPERATOR_TRY"}},
        {"PARAMETER", {"VALUE_PARAMETER"}}, {"POSITIONAL_REFERENCE", {"POSITIONAL_REFERENCE"}},
        {"STAR", {"STAR"}}, {"SUBQUERY", {"SUBQUERY"}},
        {"WINDOW", {"WINDOW_AGGREGATE", "WINDOW_RANK", "WINDOW_RANK_DENSE", "WINDOW_NTILE", "WINDOW_PERCENT_RANK", "WINDOW_CUME_DIST", "WINDOW_ROW_NUMBER", "WINDOW_FIRST_VALUE", "WINDOW_LAST_VALUE", "WINDOW_LEAD", "WINDOW_LAG", "WINDOW_NTH_VALUE", "WINDOW_FILL"}}
    };

    Grammar() {
        auto doc = Parse(grammar_json);
        auto root = yyjson_doc_get_root(doc.get());
        size_t i, max, j, count;
        Json *key, *value, *field, *type;
        yyjson_obj_foreach(yyjson_obj_get(root, "rules"), i, max, key, value) {
            Rule rule;
            yyjson_obj_foreach(yyjson_obj_get(value, "fields"), j, count, field, type) {
                rule.fields.emplace(Text(field), Text(type));
            }
            rule.required = StringList(yyjson_obj_get(value, "required"));
            rules.emplace(Text(key), std::move(rule));
        }
        yyjson_obj_foreach(yyjson_obj_get(root, "dispatch"), i, max, key, value) {
            auto &mapping = dispatch[Text(key)];
            yyjson_obj_foreach(value, j, count, field, type) mapping.emplace(Text(field), Text(type));
        }
    }
};

struct Policy {
    bool schemas = false, functions = false, remote = false;
    Names allowed_schemas, allowed_functions, blocked_functions;
    Json *readers = nullptr;

    explicit Policy(Json *value) {
        if (!yyjson_is_obj(value)) throw std::runtime_error("expected policy object");
        Names seen;
        size_t i, max;
        Json *key, *item;
        yyjson_obj_foreach(value, i, max, key, item) {
            auto name = Text(key);
            if (!seen.insert(name).second) throw std::runtime_error("duplicate policy field");
            if (name == "check_schemas" || name == "check_functions" || name == "reject_remote_uris") {
                if (!yyjson_is_bool(item)) throw std::runtime_error("expected policy boolean");
                if (name == "check_schemas") schemas = yyjson_get_bool(item);
                if (name == "check_functions") functions = yyjson_get_bool(item);
                if (name == "reject_remote_uris") remote = yyjson_get_bool(item);
            } else if (name == "allowed_schemas") allowed_schemas = StringList(item);
            else if (name == "allowed_functions") allowed_functions = StringList(item);
            else if (name == "blocked_functions") blocked_functions = StringList(item);
            else if (name == "remote_readers") {
                if (!yyjson_is_obj(item)) throw std::runtime_error("expected remote reader inventory");
                readers = item;
            } else throw std::runtime_error("unknown policy field: " + name);
        }
        if (functions && !blocked_functions.empty()) throw std::runtime_error("allowlist and blocklist cannot both be configured");
        if (remote && !readers) throw std::runtime_error("remote reader inventory required");
    }
};

struct Failure : std::runtime_error {
    std::string code;
    Failure(std::string code, std::string message) : std::runtime_error(message), code(std::move(code)) {}
};

struct Validation {
    const Grammar &grammar;
    const Policy &policy;
    Names violations;
    std::map<std::string, size_t> functions;
    size_t nodes = 0;

    void Unsupported(const std::string &message) {
        throw Failure("unsupported", message);
    }

    static std::string Schema(std::string value) {
        if (value.rfind("schema_name:", 0) == 0) value.erase(0, 12);
        return value;
    }

    void RemoteString(const std::string &value, const std::string &location) {
        auto lower = Lower(value);
        for (auto prefix : {"http://", "https://", "s3://", "s3a://", "s3n://", "gcs://", "gs://", "r2://", "hf://", "azure://", "az://", "abfs://", "abfss://"}) {
            if (lower.find(prefix) != std::string::npos) {
                violations.insert("remote URI prefix '" + std::string(prefix) + "' is not allowed in " + location);
                return;
            }
        }
    }

    void PathLiterals(Json *value, const std::string &name, size_t depth) {
        if (depth > 512) Unsupported("AST nesting limit exceeded");
        if (yyjson_is_obj(value)) {
            if (Field(value, "class") == "CONSTANT") {
                auto literal = yyjson_obj_get(yyjson_obj_get(value, "value"), "value");
                if (yyjson_is_str(literal)) RemoteString(Text(literal), "path argument to function '" + name + "'");
            }
            size_t i, max;
            Json *key, *child;
            yyjson_obj_foreach(value, i, max, key, child) PathLiterals(child, name, depth + 1);
        } else if (yyjson_is_arr(value)) {
            size_t i, max;
            Json *child;
            yyjson_arr_foreach(value, i, max, child) PathLiterals(child, name, depth + 1);
        }
    }

    void TableFunction(Json *value) {
        auto function = yyjson_obj_get(value, "function");
        auto name = Lower(Field(function, "function_name"));
        if (name == "query" || name == "json_execute_serialized_sql") {
            violations.insert("nested SQL executor '" + name + "' is not allowed");
            return;
        }
        auto reader = yyjson_obj_getn(policy.readers, name.data(), name.size());
        if (!reader) return;
        if (!yyjson_is_obj(reader)) throw std::runtime_error("invalid reader inventory entry");
        auto named = yyjson_obj_get(reader, "Named");
        Names named_args;
        if (named && !yyjson_is_null(named)) named_args = StringList(named);
        auto positions = yyjson_obj_get(reader, "Positional");
        if (positions && !yyjson_is_null(positions) && !yyjson_is_arr(positions)) throw std::runtime_error("invalid positional path inventory");
        size_t i, max, position = 0;
        Json *argument;
        yyjson_arr_foreach(yyjson_obj_get(function, "children"), i, max, argument) {
            auto alias = Lower(Field(argument, "alias"));
            bool path = false;
            if (!alias.empty()) path = named_args.count(alias);
            else {
                size_t j, count;
                Json *index;
                yyjson_arr_foreach(positions, j, count, index) {
                    if (!yyjson_is_uint(index)) throw std::runtime_error("invalid positional path index");
                    if (yyjson_get_uint(index) == position) path = true;
                }
                position++;
            }
            if (path) PathLiterals(argument, name, 0);
        }
    }

    void Reference(Json *value, const std::string &kind, const Names &scope, const std::string &edge) {
        if (kind == "FunctionExpression" || kind == "WindowExpression") {
            auto name = Lower(Field(value, "function_name"));
            functions[name]++;
            if (policy.schemas && yyjson_obj_get(value, "catalog")) violations.insert("access to catalog '" + Field(value, "catalog") + "' is not allowed");
            if (policy.remote && kind == "FunctionExpression" && edge != "function" && name == "json_serialize_plan") {
                auto catalog = Lower(Field(value, "catalog"));
                auto schema = Lower(Field(value, "schema"));
                if ((catalog.empty() || catalog == "system") && (schema.empty() || schema == "main" || schema == "system")) violations.insert("nested SQL executor 'json_serialize_plan' is not allowed");
            }
        }
        if (policy.remote && kind == "TableFunctionRef") TableFunction(value);
        if (policy.remote && kind == "BaseTableRef") RemoteString(Field(value, "table_name"), "replacement scan");
        if (!policy.schemas || (kind != "BaseTableRef" && kind != "ShowRef")) return;
        if (yyjson_obj_get(value, "catalog_name")) {
            violations.insert("access to catalog '" + Field(value, "catalog_name") + "' is not allowed");
            return;
        }
        if (kind == "ShowRef" && yyjson_obj_get(value, "query")) return;
        auto schema = Schema(Field(value, "schema_name"));
        auto table = Field(value, "table_name");
        if (schema.empty()) {
            if (kind == "ShowRef") violations.insert("SHOW statement requires an explicit authorized schema");
            else if (!scope.count(Lower(table))) violations.insert("unauthorized access to table '" + table + "' with empty schema");
        } else if (!policy.allowed_schemas.count(schema)) violations.insert("unauthorized access to schema '" + schema + "'");
    }

    void Check(Json *value, std::string expected, Names scope = {}, size_t depth = 0, std::string edge = {}) {
        if (++nodes > 100000 || depth > 512) Unsupported("AST size or nesting limit exceeded");
        if (expected == "opaque") return;
        if (expected.size() > 2 && expected.substr(expected.size() - 2) == "[]") {
            if (!yyjson_is_arr(value)) Unsupported("expected array: " + expected);
            size_t i, max;
            Json *child;
            yyjson_arr_foreach(value, i, max, child) Check(child, expected.substr(0, expected.size() - 2), scope, depth + 1);
            return;
        }
        if (expected == "string" || expected == "boolean" || expected == "number") {
            if ((expected == "string" && !yyjson_is_str(value)) || (expected == "boolean" && !yyjson_is_bool(value)) || (expected == "number" && !yyjson_is_num(value))) Unsupported("unexpected field type: " + expected);
            return;
        }
        if (!yyjson_is_obj(value)) Unsupported("expected object: " + expected);
        auto dispatch = grammar.dispatch.find(expected);
        if (dispatch != grammar.dispatch.end()) {
            auto tag = Field(value, expected == "ParsedExpression" ? "class" : "type");
            if (expected == "ParsedExpression") {
                auto types = grammar.expression_types.find(tag);
                if (types == grammar.expression_types.end() || !types->second.count(Field(value, "type"))) Unsupported("unsupported expression type");
            }
            auto kind = dispatch->second.find(tag);
            if (kind == dispatch->second.end()) Unsupported("unsupported " + expected + ": " + tag);
            expected = kind->second;
        }
        auto found = grammar.rules.find(expected);
        if (found == grammar.rules.end()) Unsupported("unknown AST rule");
        const auto &rule = found->second;
        for (const auto &key : rule.required) if (!yyjson_obj_getn(value, key.data(), key.size())) Unsupported("missing " + expected + "." + key);
        Names seen;
        size_t i, max;
        Json *key, *child;
        yyjson_obj_foreach(value, i, max, key, child) {
            auto name = Text(key);
            if (!seen.insert(name).second || !rule.fields.count(name)) Unsupported("unknown or duplicate field: " + expected + "." + name);
        }
        if (expected == "ShowRef" && !Names{"SHOW_FROM", "SHOW_UNQUALIFIED", "DESCRIBE", "SUMMARY"}.count(Field(value, "show_type"))) Unsupported("unsupported SHOW kind");
        if (expected == "SetOperationNode" && !Names{"UNION", "EXCEPT", "INTERSECT", "UNION_BY_NAME"}.count(Field(value, "setop_type"))) Unsupported("unsupported set operation");

        auto ctes = yyjson_obj_get(value, "cte_map");
        if (ctes) {
            if (!yyjson_is_obj(ctes) || yyjson_obj_size(ctes) > 1) Unsupported("invalid CTE map");
            auto entries = yyjson_obj_get(ctes, "map");
            if (yyjson_obj_size(ctes) && !entries) Unsupported("unknown CTE map field");
            if (entries && !yyjson_is_arr(entries)) Unsupported("invalid CTE entries");
            Names declared;
            yyjson_arr_foreach(entries, i, max, child) {
                Check(child, "CommonTableExpressionInfoEntry", scope, depth + 1);
                auto name = Lower(Field(child, "key"));
                if (!declared.insert(name).second) Unsupported("duplicate CTE declaration");
                scope.insert(name);
            }
        }
        yyjson_obj_foreach(value, i, max, key, child) {
            auto name = Text(key);
            if (name == "cte_map") continue;
            auto child_scope = scope;
            if (expected == "RecursiveCTENode" && name == "right") child_scope.insert(Lower(Field(value, "cte_name")));
            Check(child, rule.fields.at(name), child_scope, depth + 1, name);
        }
        Reference(value, expected, scope, edge);
    }

    void Finish() {
        for (const auto &[name, count] : functions) {
            std::string message;
            if (policy.functions && !policy.allowed_functions.count(name)) message = "function '" + name + "' is not in the allowlist";
            if (policy.blocked_functions.count(name)) message = "use of function '" + name + "' is not allowed";
            if (!message.empty()) {
                if (count > 1) message += " (" + std::to_string(count) + " occurrences)";
                violations.insert(message);
            }
        }
    }
};

static std::string Result(const std::string &code, const Names &messages) {
    auto doc = yyjson_mut_doc_new(nullptr);
    if (!doc) throw std::bad_alloc();
    auto root = yyjson_mut_obj(doc);
    yyjson_mut_doc_set_root(doc, root);
    yyjson_mut_obj_add_bool(doc, root, "allowed", code == "ok");
    yyjson_mut_obj_add_strcpy(doc, root, "code", code.c_str());
    auto array = yyjson_mut_arr(doc);
    for (const auto &message : messages) yyjson_mut_arr_add_strcpy(doc, array, message.c_str());
    yyjson_mut_obj_add_val(doc, root, "violations", array);
    size_t len;
    char *text = yyjson_mut_write(doc, 0, &len);
    yyjson_mut_doc_free(doc);
    if (!text) throw std::bad_alloc();
    std::string result(text, len);
    free(text);
    return result;
}

static std::string Validate(const Grammar &grammar, const std::string &ast, const std::string &policy_text) {
    try {
        if (ast.size() > 8 * 1024 * 1024 || policy_text.size() > 1024 * 1024) throw Failure("unsupported", "input size limit exceeded");
        auto ast_doc = Parse(ast);
        auto policy_doc = Parse(policy_text);
        Policy policy(yyjson_doc_get_root(policy_doc.get()));
        auto root = yyjson_doc_get_root(ast_doc.get());
        auto error = yyjson_obj_get(root, "error");
        if (!yyjson_is_bool(error)) throw Failure("unsupported", "missing parser error status");
        if (yyjson_get_bool(error)) return Result("parser", {Field(root, "error_message")});
        Validation validation{grammar, policy};
        validation.Check(root, "root");
        validation.Finish();
        return Result(validation.violations.empty() ? "ok" : "forbidden", validation.violations);
    } catch (const Failure &error) {
        return Result(error.code, {error.what()});
    } catch (const std::runtime_error &error) {
        return Result("invalid_input", {error.what()});
    }
}

static void Scalar(duckdb_function_info info, duckdb_data_chunk input, duckdb_vector output) {
    try {
        auto grammar = static_cast<Grammar *>(duckdb_scalar_function_get_extra_info(info));
        auto ast = duckdb_data_chunk_get_vector(input, 0);
        auto policy = duckdb_data_chunk_get_vector(input, 1);
        auto ast_values = static_cast<duckdb_string_t *>(duckdb_vector_get_data(ast));
        auto policy_values = static_cast<duckdb_string_t *>(duckdb_vector_get_data(policy));
        auto ast_validity = duckdb_vector_get_validity(ast);
        auto policy_validity = duckdb_vector_get_validity(policy);
        for (idx_t row = 0; row < duckdb_data_chunk_get_size(input); row++) {
            std::string result;
            if ((ast_validity && !duckdb_validity_row_is_valid(ast_validity, row)) || (policy_validity && !duckdb_validity_row_is_valid(policy_validity, row))) result = Result("invalid_input", {"NULL input"});
            else result = Validate(*grammar,
                std::string(duckdb_string_t_data(&ast_values[row]), duckdb_string_t_length(ast_values[row])),
                std::string(duckdb_string_t_data(&policy_values[row]), duckdb_string_t_length(policy_values[row])));
            duckdb_vector_assign_string_element_len(output, row, result.data(), result.size());
        }
    } catch (const std::exception &error) {
        duckdb_scalar_function_set_error(info, error.what());
    } catch (...) {
        duckdb_scalar_function_set_error(info, "native validation failed");
    }
}

DUCKDB_EXTENSION_ENTRYPOINT(duckdb_connection connection, duckdb_extension_info info, struct duckdb_extension_access *access) {
    try {
        auto function = duckdb_create_scalar_function();
        auto type = duckdb_create_logical_type(DUCKDB_TYPE_VARCHAR);
        duckdb_scalar_function_set_name(function, "mosaic_validate_ast");
        duckdb_scalar_function_add_parameter(function, type);
        duckdb_scalar_function_add_parameter(function, type);
        duckdb_scalar_function_set_return_type(function, type);
        duckdb_scalar_function_set_special_handling(function);
        duckdb_scalar_function_set_extra_info(function, new Grammar(), [](void *ptr) { delete static_cast<Grammar *>(ptr); });
        duckdb_scalar_function_set_function(function, Scalar);
        auto state = duckdb_register_scalar_function(connection, function);
        duckdb_destroy_logical_type(&type);
        duckdb_destroy_scalar_function(&function);
        return state == DuckDBSuccess;
    } catch (const std::exception &error) {
        access->set_error(info, error.what());
        return false;
    }
}
