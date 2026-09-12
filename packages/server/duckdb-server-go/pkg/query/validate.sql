-- DuckDB v1.5.5 serialization contract: https://github.com/duckdb/duckdb/tree/v1.5.5/src/include/duckdb/storage/serialization
--
-- This file is a template. @@name@@ placeholders carry the server-level policy and are substituted with SQL literals
-- once, when the statement is prepared. The per-request input (query text and schema policy) is returned as JSON by
-- the volatile scalar function @@request@@(): DuckDB never caches a parameterized plan that contains a table function
-- scan (PreparedStatement::CanCachePlan), but a zero-parameter prepared statement is planned once per connection.
-- The scalar subquery around the json_tree argument keeps json_tree in table-in-out mode; a plain scalar argument is
-- evaluated once at bind time even though the function is volatile.
WITH
grammar AS (
    SELECT MAP {
        'root': {'fields': MAP {'error': 'BOOLEAN', 'statements': 'statement[]', 'error_type': 'VARCHAR', 'error_subtype': 'VARCHAR', 'error_message': 'VARCHAR', 'position': 'VARCHAR'}, 'required': ['error'], 'accepts': ['root'], 'types': NULL},
        'statement': {'fields': MAP {'node': 'query', 'named_param_map': 'opaque'}, 'required': ['node'], 'accepts': ['statement'], 'types': NULL},
        'SELECT_NODE': {'fields': MAP {'type': 'VARCHAR', 'modifiers': 'modifier[]', 'cte_map': 'cte_map', 'select_list': 'expression[]', 'from_table': 'table', 'where_clause': 'expression', 'group_expressions': 'expression[]', 'group_sets': 'opaque', 'aggregate_handling': 'VARCHAR', 'having': 'expression', 'sample': 'sample', 'qualify': 'expression'}, 'required': ['type', 'select_list', 'from_table'], 'accepts': ['query', 'SELECT_NODE'], 'types': NULL},
        'SET_OPERATION_NODE': {'fields': MAP {'type': 'VARCHAR', 'modifiers': 'modifier[]', 'cte_map': 'cte_map', 'setop_type': 'VARCHAR', 'left': 'query', 'right': 'query', 'children': 'query[]', 'setop_all': 'BOOLEAN'}, 'required': ['type', 'left', 'right', 'setop_type'], 'accepts': ['query', 'SET_OPERATION_NODE'], 'types': NULL},
        'RECURSIVE_CTE_NODE': {'fields': MAP {'type': 'VARCHAR', 'modifiers': 'modifier[]', 'cte_map': 'cte_map', 'cte_name': 'VARCHAR', 'union_all': 'BOOLEAN', 'left': 'query', 'right': 'query', 'aliases': 'VARCHAR[]', 'key_targets': 'expression[]'}, 'required': ['type', 'cte_name', 'left', 'right'], 'accepts': ['query', 'RECURSIVE_CTE_NODE'], 'types': NULL},
        'cte_map': {'fields': MAP {'map': 'cte_entry[]'}, 'required': [], 'accepts': ['cte_map'], 'types': NULL},
        'cte_entry': {'fields': MAP {'key': 'VARCHAR', 'value': 'cte_info'}, 'required': ['key', 'value'], 'accepts': ['cte_entry'], 'types': NULL},
        'cte_info': {'fields': MAP {'aliases': 'VARCHAR[]', 'query': 'statement', 'materialized': 'VARCHAR', 'key_targets': 'expression[]'}, 'required': ['query'], 'accepts': ['cte_info'], 'types': NULL},
        'BASE_TABLE': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'schema_name': 'VARCHAR', 'table_name': 'VARCHAR', 'column_name_alias': 'VARCHAR[]', 'catalog_name': 'VARCHAR', 'at_clause': 'at_clause'}, 'required': ['type', 'table_name'], 'accepts': ['table', 'BASE_TABLE'], 'types': NULL},
        'JOIN': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'left': 'table', 'right': 'table', 'condition': 'expression', 'join_type': 'VARCHAR', 'ref_type': 'VARCHAR', 'using_columns': 'VARCHAR[]', 'delim_flipped': 'BOOLEAN', 'duplicate_eliminated_columns': 'expression[]', 'is_implicit': 'BOOLEAN'}, 'required': ['type', 'left', 'right'], 'accepts': ['table', 'JOIN'], 'types': NULL},
        'SUBQUERY': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'subquery': 'statement', 'column_name_alias': 'VARCHAR[]'}, 'required': ['type', 'subquery'], 'accepts': ['table', 'SUBQUERY'], 'types': NULL},
        'TABLE_FUNCTION': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'function': 'expression', 'column_name_alias': 'VARCHAR[]', 'with_ordinality': 'VARCHAR'}, 'required': ['type', 'function'], 'accepts': ['table', 'TABLE_FUNCTION'], 'types': NULL},
        'EMPTY': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number'}, 'required': ['type'], 'accepts': ['table', 'EMPTY'], 'types': NULL},
        'EXPRESSION_LIST': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'expected_names': 'VARCHAR[]', 'expected_types': 'opaque', 'values': 'expression[][]'}, 'required': ['type', 'values'], 'accepts': ['table', 'EXPRESSION_LIST'], 'types': NULL},
        'PIVOT': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'source': 'table', 'aggregates': 'expression[]', 'unpivot_names': 'VARCHAR[]', 'pivots': 'pivot_column[]', 'groups': 'VARCHAR[]', 'column_name_alias': 'VARCHAR[]', 'include_nulls': 'BOOLEAN'}, 'required': ['type', 'source'], 'accepts': ['table', 'PIVOT'], 'types': NULL},
        'SHOW_REF': {'fields': MAP {'type': 'VARCHAR', 'alias': 'VARCHAR', 'sample': 'sample', 'query_location': 'number', 'table_name': 'VARCHAR', 'query': 'query', 'show_type': 'VARCHAR', 'catalog_name': 'VARCHAR', 'schema_name': 'VARCHAR'}, 'required': ['type', 'show_type'], 'accepts': ['table', 'SHOW_REF'], 'types': NULL},
        'at_clause': {'fields': MAP {'unit': 'VARCHAR', 'expr': 'expression'}, 'required': ['unit', 'expr'], 'accepts': ['at_clause'], 'types': NULL},
        'pivot_column': {'fields': MAP {'pivot_expressions': 'expression[]', 'unpivot_names': 'VARCHAR[]', 'entries': 'pivot_entry[]', 'pivot_enum': 'VARCHAR'}, 'required': [], 'accepts': ['pivot_column'], 'types': NULL},
        'pivot_entry': {'fields': MAP {'values': 'opaque', 'star_expr': 'expression', 'alias': 'VARCHAR'}, 'required': [], 'accepts': ['pivot_entry'], 'types': NULL},
        'sample': {'fields': MAP {'sample_size': 'opaque', 'is_percentage': 'BOOLEAN', 'method': 'VARCHAR', 'seed': 'number'}, 'required': ['sample_size'], 'accepts': ['sample'], 'types': NULL},
        'LIMIT_MODIFIER': {'fields': MAP {'type': 'VARCHAR', 'limit': 'expression', 'offset': 'expression'}, 'required': ['type'], 'accepts': ['modifier', 'LIMIT_MODIFIER'], 'types': NULL},
        'LIMIT_PERCENT_MODIFIER': {'fields': MAP {'type': 'VARCHAR', 'limit': 'expression', 'offset': 'expression'}, 'required': ['type'], 'accepts': ['modifier', 'LIMIT_PERCENT_MODIFIER'], 'types': NULL},
        'DISTINCT_MODIFIER': {'fields': MAP {'type': 'VARCHAR', 'distinct_on_targets': 'expression[]'}, 'required': ['type'], 'accepts': ['modifier', 'DISTINCT_MODIFIER'], 'types': NULL},
        'ORDER_MODIFIER': {'fields': MAP {'type': 'VARCHAR', 'orders': 'order[]'}, 'required': ['type'], 'accepts': ['modifier', 'ORDER_MODIFIER'], 'types': NULL},
        'order': {'fields': MAP {'type': 'VARCHAR', 'null_order': 'VARCHAR', 'expression': 'expression'}, 'required': ['expression'], 'accepts': ['order'], 'types': NULL},
        'case_check': {'fields': MAP {'when_expr': 'expression', 'then_expr': 'expression'}, 'required': ['when_expr', 'then_expr'], 'accepts': ['case_check'], 'types': NULL},
        'replacement': {'fields': MAP {'key': 'VARCHAR', 'value': 'expression'}, 'required': ['key', 'value'], 'accepts': ['replacement'], 'types': NULL},
        'expression:BETWEEN': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'input': 'expression', 'lower': 'expression', 'upper': 'expression'}, 'required': ['class', 'type', 'input', 'lower', 'upper'], 'accepts': ['expression'], 'types': ['COMPARE_BETWEEN', 'COMPARE_NOT_BETWEEN']},
        'expression:CASE': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'case_checks': 'case_check[]', 'else_expr': 'expression'}, 'required': ['class', 'type', 'else_expr'], 'accepts': ['expression'], 'types': ['CASE_EXPR']},
        'expression:CAST': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'child': 'expression', 'cast_type': 'opaque', 'try_cast': 'BOOLEAN'}, 'required': ['class', 'type', 'child', 'cast_type'], 'accepts': ['expression'], 'types': ['OPERATOR_CAST']},
        'expression:COLLATE': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'child': 'expression', 'collation': 'VARCHAR'}, 'required': ['class', 'type', 'child', 'collation'], 'accepts': ['expression'], 'types': ['COLLATE']},
        'expression:COLUMN_REF': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'column_names': 'VARCHAR[]'}, 'required': ['class', 'type', 'column_names'], 'accepts': ['expression'], 'types': ['COLUMN_REF']},
        'expression:COMPARISON': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'left': 'expression', 'right': 'expression'}, 'required': ['class', 'type', 'left', 'right'], 'accepts': ['expression'], 'types': ['COMPARE_EQUAL', 'COMPARE_NOTEQUAL', 'COMPARE_LESSTHAN', 'COMPARE_GREATERTHAN', 'COMPARE_LESSTHANOREQUALTO', 'COMPARE_GREATERTHANOREQUALTO', 'COMPARE_DISTINCT_FROM', 'COMPARE_NOT_DISTINCT_FROM']},
        'expression:CONJUNCTION': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'children': 'expression[]'}, 'required': ['class', 'type', 'children'], 'accepts': ['expression'], 'types': ['CONJUNCTION_AND', 'CONJUNCTION_OR']},
        'expression:CONSTANT': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'value': 'opaque'}, 'required': ['class', 'type', 'value'], 'accepts': ['expression'], 'types': ['VALUE_CONSTANT']},
        'expression:FUNCTION': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'function_name': 'VARCHAR', 'schema': 'VARCHAR', 'children': 'expression[]', 'filter': 'expression', 'order_bys': 'modifier', 'distinct': 'BOOLEAN', 'is_operator': 'BOOLEAN', 'export_state': 'BOOLEAN', 'catalog': 'VARCHAR'}, 'required': ['class', 'type', 'function_name'], 'accepts': ['expression'], 'types': ['FUNCTION']},
        'expression:LAMBDA': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'lhs': 'expression', 'expr': 'expression', 'syntax_type': 'VARCHAR'}, 'required': ['class', 'type', 'lhs', 'expr'], 'accepts': ['expression'], 'types': ['LAMBDA']},
        'expression:OPERATOR': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'children': 'expression[]'}, 'required': ['class', 'type', 'children'], 'accepts': ['expression'], 'types': ['OPERATOR_NOT', 'OPERATOR_IS_NULL', 'OPERATOR_IS_NOT_NULL', 'OPERATOR_UNPACK', 'COMPARE_IN', 'COMPARE_NOT_IN', 'GROUPING_FUNCTION', 'OPERATOR_COALESCE', 'ARRAY_EXTRACT', 'ARRAY_SLICE', 'STRUCT_EXTRACT', 'ARRAY_CONSTRUCTOR', 'ARROW', 'OPERATOR_TRY']},
        'expression:PARAMETER': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'identifier': 'VARCHAR'}, 'required': ['class', 'type', 'identifier'], 'accepts': ['expression'], 'types': ['VALUE_PARAMETER']},
        'expression:POSITIONAL_REFERENCE': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'index': 'number'}, 'required': ['class', 'type', 'index'], 'accepts': ['expression'], 'types': ['POSITIONAL_REFERENCE']},
        'expression:STAR': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'relation_name': 'VARCHAR', 'exclude_list': 'opaque', 'replace_list': 'replacement[]', 'columns': 'BOOLEAN', 'expr': 'expression', 'unpacked': 'BOOLEAN', 'qualified_exclude_list': 'opaque', 'rename_list': 'opaque'}, 'required': ['class', 'type'], 'accepts': ['expression'], 'types': ['STAR']},
        'expression:SUBQUERY': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'subquery_type': 'VARCHAR', 'subquery': 'statement', 'child': 'expression', 'comparison_type': 'VARCHAR'}, 'required': ['class', 'type', 'subquery', 'subquery_type'], 'accepts': ['expression'], 'types': ['SUBQUERY']},
        'expression:WINDOW': {'fields': MAP {'class': 'VARCHAR', 'type': 'VARCHAR', 'alias': 'VARCHAR', 'query_location': 'number', 'function_name': 'VARCHAR', 'schema': 'VARCHAR', 'catalog': 'VARCHAR', 'children': 'expression[]', 'partitions': 'expression[]', 'orders': 'order[]', 'start': 'VARCHAR', 'end': 'VARCHAR', 'start_expr': 'expression', 'end_expr': 'expression', 'offset_expr': 'expression', 'default_expr': 'expression', 'ignore_nulls': 'BOOLEAN', 'filter_expr': 'expression', 'exclude_clause': 'VARCHAR', 'distinct': 'BOOLEAN', 'arg_orders': 'order[]'}, 'required': ['class', 'type', 'function_name'], 'accepts': ['expression'], 'types': ['WINDOW_AGGREGATE', 'WINDOW_RANK', 'WINDOW_RANK_DENSE', 'WINDOW_NTILE', 'WINDOW_PERCENT_RANK', 'WINDOW_CUME_DIST', 'WINDOW_ROW_NUMBER', 'WINDOW_FIRST_VALUE', 'WINDOW_LAST_VALUE', 'WINDOW_LEAD', 'WINDOW_LAG', 'WINDOW_NTH_VALUE', 'WINDOW_FILL']}
    }::MAP(VARCHAR, STRUCT(fields MAP(VARCHAR, VARCHAR), required VARCHAR[], accepts VARCHAR[], types VARCHAR[])) AS rules
),
-- One row per JSON node. Field name, owner key, and array depth come from the node's own path, and each object's
-- relevant scalar properties are pulled out with a single JSON parse; only the owner lookup below needs a join.
nodes AS MATERIALIZED (
    SELECT n.*, g.rules[n.kind] AS rule,
        system.main.regexp_extract(stem, '\.([^.\[\]]+)$', 1) AS field,
        system.main.regexp_replace(stem, '\.[^.\[\]]+$', '') AS owner_key,
        system.main.len(system.main.string_split(fullkey[system.main.length(stem) + 1:], '[')) - 1 AS depth
    FROM (
        SELECT *, CASE WHEN type = 'OBJECT' THEN CASE
            WHEN parent IS NULL THEN 'root'
            WHEN class IS NOT NULL THEN 'expression:' || class
            WHEN node_type IS NOT NULL AND pkey != 'orders' AND pkey != 'arg_orders' THEN node_type
            WHEN key IN ('query', 'subquery') OR pkey = 'statements' THEN 'statement'
            WHEN key = 'cte_map' THEN 'cte_map'
            WHEN pkey = 'map' AND gpkey = 'cte_map' THEN 'cte_entry'
            WHEN key = 'value' AND gpkey = 'map' THEN 'cte_info'
            WHEN key IN ('sample', 'at_clause') THEN key
            WHEN pkey IN ('orders', 'arg_orders') THEN 'order'
            WHEN pkey = 'case_checks' THEN 'case_check'
            WHEN pkey = 'pivots' THEN 'pivot_column'
            WHEN pkey = 'entries' THEN 'pivot_entry'
            WHEN pkey = 'replace_list' THEN 'replacement'
        END END AS kind
        FROM (
            SELECT id, parent, key, type, fullkey, keys, children, error_is_bool,
                system.main.regexp_replace(fullkey, '(\[\d+\])+$', '') AS stem,
                coalesce(nullif(pk.name, ''), nullif(pk.index, '')) AS pkey,
                coalesce(nullif(gpk.name, ''), nullif(gpk.index, '')) AS gpkey,
                props[1] AS class, props[2] AS node_type, props[3] AS schema_name, props[4] AS table_name,
                props[5] AS function_name, props[6] AS catalog, props[7] AS catalog_name, props[8] AS show_type,
                props[9] AS setop_type, props[10] AS cte_key, props[11] AS cte_body_type, props[12] AS query,
                props[13] AS schema, props[14] AS literal, props[15] AS error, props[16] AS error_type,
                props[17] AS error_subtype, props[18] AS error_message, props[19] AS position
            FROM (
                SELECT t.id, t.parent, t.key, t.type, t.fullkey,
                    system.main.regexp_extract(t.path, '(?:\.([^.\[\]]+)|\[(\d+)\])$', ['name', 'index']) AS pk,
                    system.main.regexp_extract(t.path, '(?:\.([^.\[\]]+)|\[(\d+)\])(?:\.[^.\[\]]+|\[\d+\])$', ['name', 'index']) AS gpk,
                    CASE WHEN t.type = 'OBJECT' THEN system.main.json_extract_string(t.value, [
                        'class', 'type', 'schema_name', 'table_name', 'function_name', 'catalog', 'catalog_name',
                        'show_type', 'setop_type', 'key', '$.value.query.node.type', 'query', 'schema', '$.value.value',
                        'error', 'error_type', 'error_subtype', 'error_message', 'position'
                    ]) END AS props,
                    CASE WHEN t.type = 'OBJECT' THEN system.main.json_keys(t.value) END AS keys,
                    CASE WHEN t.key = 'function' THEN system.main.json_extract(t.value, 'children') END AS children,
                    CASE WHEN t.parent IS NULL THEN system.main.json_type(t.value, 'error') = 'BOOLEAN' END AS error_is_bool
                FROM system.main.json_tree((SELECT system.main.json_serialize_sql(@@request@@()->>'query',
                    skip_default := true, skip_empty := true, skip_null := true))) t
            )
        )
    ) n
    CROSS JOIN grammar g
),
-- The grammar nests arrays at most twice; object edges are checked independently of AST depth.
edges AS MATERIALIZED (
    SELECT t.* EXCLUDE (parent, field, owner_key, depth), o.kind AS owner_kind,
        CASE WHEN t.parent IS NULL THEN 'root'
            WHEN t.depth = 0 THEN o.rule.fields[t.field]
            WHEN t.depth = 1 THEN system.main.regexp_extract(o.rule.fields[t.field], '^(.*)\[\]$', 1)
            WHEN t.depth = 2 THEN system.main.regexp_extract(o.rule.fields[t.field], '^(.*)\[\]\[\]$', 1)
        END AS expected
    FROM nodes t
    LEFT JOIN nodes o ON o.type = 'OBJECT' AND o.fullkey = t.owner_key
),
walk AS MATERIALIZED (
    SELECT e.* FROM edges e
    ANTI JOIN edges data ON data.expected = 'opaque' AND e.id > data.id
        AND (system.main.starts_with(e.fullkey, data.fullkey || '.')
            OR system.main.starts_with(e.fullkey, data.fullkey || '['))
),
invalid AS (
    SELECT 'unsupported SQL AST at ' || fullkey || ' (expected ' || coalesce(expected, 'known field') || ')' AS message
    FROM walk
    WHERE NOT coalesce(CASE
        WHEN expected = 'opaque' THEN true
        WHEN system.main.ends_with(expected, '[]') THEN type = 'ARRAY'
        WHEN expected IN ('VARCHAR', 'BOOLEAN') THEN type = expected
        WHEN expected = 'number' THEN type IN ('UBIGINT', 'BIGINT', 'DOUBLE')
        ELSE type = 'OBJECT' AND rule IS NOT NULL
            AND system.main.list_has_all(keys, rule.required)
            AND CASE kind
                WHEN 'root' THEN error_is_bool AND (error = 'true' OR system.main.list_contains(keys, 'statements'))
                WHEN 'SHOW_REF' THEN show_type IN ('SHOW_FROM', 'SHOW_UNQUALIFIED', 'DESCRIBE', 'SUMMARY')
                WHEN 'SET_OPERATION_NODE' THEN setop_type IN ('UNION', 'EXCEPT', 'INTERSECT', 'UNION_BY_NAME')
                ELSE true END
            AND system.main.list_contains(rule.accepts, expected)
            AND (rule.types IS NULL OR system.main.list_contains(rule.types, node_type))
        END, false)
),
refs AS (
    SELECT * EXCLUDE (schema_name, function_name, literal),
        system.main.regexp_replace(coalesce(schema_name, ''), '^schema_name:', '') AS schema_name,
        system.main.lower(function_name) AS function_name,
        system.main.lower(literal) AS literal,
        system.main.list(system.main.struct_pack(
            id := id, fullkey := fullkey,
            name := system.main.translate(cte_key, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'),
            scope := system.main.regexp_replace(fullkey, '\.cte_map\.map\[\d+\]$', ''),
            recursive := cte_body_type = 'RECURSIVE_CTE_NODE'
        )) FILTER (WHERE expected = 'cte_entry') OVER () AS ctes
    FROM walk
    WHERE expected IN ('table', 'expression', 'cte_entry')
),
violations AS (
    SELECT CASE
        WHEN class IN ('FUNCTION', 'WINDOW') AND catalog IS NOT NULL THEN
            'access to catalog ''' || system.main.regexp_replace(catalog, '^catalog:', '') || ''' is not allowed'
        WHEN node_type IN ('BASE_TABLE', 'SHOW_REF') AND catalog_name IS NOT NULL THEN
            'access to catalog ''' || system.main.regexp_replace(catalog_name, '^catalog_name:', '') || ''' is not allowed'
        WHEN node_type = 'SHOW_REF' AND query IS NULL AND schema_name = '' THEN
            'SHOW statement requires an explicit authorized schema'
        WHEN (node_type = 'BASE_TABLE' OR (node_type = 'SHOW_REF' AND query IS NULL))
            AND schema_name != '' AND NOT system.main.list_contains(request.allowed_schemas, schema_name) THEN
            'unauthorized access to schema ''' || schema_name || ''''
        WHEN node_type = 'BASE_TABLE' AND schema_name = '' AND system.main.len(system.main.list_filter(coalesce(ctes, []), c ->
            c.name = system.main.translate(table_name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')
            AND system.main.starts_with(fullkey, c.scope || '.')
            AND (
                NOT system.main.starts_with(fullkey, c.scope || '.cte_map.')
                OR system.main.len(system.main.list_filter(ctes, s ->
                    s.scope = c.scope AND s.id > c.id AND system.main.starts_with(fullkey, s.fullkey || '.'))) > 0
                OR (c.recursive AND system.main.starts_with(fullkey, c.fullkey || '.value.query.node.right.'))
            ))) = 0
        THEN 'unauthorized access to table ''' || table_name || ''' with empty schema'
        END AS message
    FROM refs
    CROSS JOIN (
        SELECT (r->>'check_schemas')::BOOLEAN AS check_schemas,
            coalesce(system.main.from_json(r->'allowed_schemas', '["VARCHAR"]'), []) AS allowed_schemas
        FROM (SELECT @@request@@()::JSON AS r)
    ) request
    WHERE request.check_schemas AND expected IN ('table', 'expression')
),
function_uses AS (
    SELECT function_name,
        system.main.count(*) OVER (ORDER BY function_name RANGE BETWEEN CURRENT ROW AND CURRENT ROW) AS occurrences,
        system.main.lag(function_name) OVER (ORDER BY function_name) AS previous
    FROM refs
    WHERE (system.main.len(@@blocked_functions@@) > 0 OR @@check_functions@@)
        AND class IN ('FUNCTION', 'WINDOW') AND (
        system.main.list_contains(@@blocked_functions@@, function_name)
        OR (@@check_functions@@ AND NOT system.main.list_contains(@@allowed_functions@@, function_name))
    )
),
function_violations AS (
    SELECT CASE WHEN @@check_functions@@
        THEN 'function ''' || function_name || ''' is not in the allowlist'
        ELSE 'use of function ''' || function_name || ''' is not allowed' END
        || CASE WHEN occurrences > 1 THEN ' (' || occurrences::VARCHAR || ' occurrences)' ELSE '' END AS message
    FROM function_uses WHERE previous IS DISTINCT FROM function_name
),
-- Every enclosing function call of a remote-looking literal, with the literal's argument index in that call.
remote_arguments AS (
    SELECT literal, unnest(system.main.list_transform(system.main.range(1, system.main.len(parts)), k -> system.main.struct_pack(
        function_key := system.main.list_reduce(parts[1:k], (a, b) -> a || '.function.children[' || b) || '.function',
        index := system.main.regexp_extract(parts[k + 1], '^(\d+)\]', 1)::BIGINT
    ))) AS arg
    FROM (
        SELECT literal, system.main.string_split(fullkey, '.function.children[') AS parts
        FROM refs
        WHERE @@reject_remote_uris@@ AND class = 'CONSTANT'
            AND system.main.len(system.main.list_filter(@@remote_prefixes@@, p -> system.main.contains(literal, p))) > 0
    ) WHERE system.main.len(parts) > 1
),
remote_violations AS (
    SELECT 'remote URI prefix ''' || unnest(system.main.list_filter(@@remote_prefixes@@, p ->
            system.main.contains(system.main.lower(table_name), p))) || ''' is not allowed in replacement scan' AS message
    FROM refs WHERE @@reject_remote_uris@@ AND node_type = 'BASE_TABLE'
    UNION ALL
    SELECT 'nested SQL executor ''' || function_name || ''' is not allowed'
    FROM refs
    WHERE @@reject_remote_uris@@ AND class = 'FUNCTION' AND (
        (key = 'function' AND function_name IN ('query', 'json_execute_serialized_sql'))
        OR (key != 'function' AND function_name = 'json_serialize_plan'
            AND system.main.lower(coalesce(catalog, '')) IN ('', 'system')
            AND system.main.lower(coalesce(schema, '')) IN ('', 'main', 'system'))
    )
    UNION ALL
    SELECT 'remote URI prefix ''' || unnest(system.main.list_filter(@@remote_prefixes@@, p -> system.main.contains(a.literal, p)))
        || ''' is not allowed in path argument to function ''' || f.function_name || ''''
    FROM remote_arguments a
    JOIN (
        SELECT fullkey, function_name, system.main.from_json(children, '["JSON"]') AS args
        FROM refs WHERE key = 'function' AND class = 'FUNCTION' AND owner_kind = 'TABLE_FUNCTION'
    ) f ON f.fullkey = a.arg.function_key
    WHERE CASE WHEN (f.args[a.arg.index + 1]->>'alias') IS NULL
        THEN system.main.list_contains(@@remote_readers@@[f.function_name].positional,
            system.main.len(system.main.list_filter(f.args[1:a.arg.index], c -> (c->>'alias') IS NULL)))
        ELSE system.main.list_contains(@@remote_readers@@[f.function_name].named,
            system.main.lower(f.args[a.arg.index + 1]->>'alias')) END
),
root AS (
    SELECT * FROM nodes WHERE parent IS NULL
),
results AS (
    SELECT 'unsupported' AS code, 'not implemented' AS error_type, '' AS error_subtype, message, '' AS position FROM invalid
    UNION ALL SELECT 'forbidden', '', '', message, '' FROM violations WHERE message IS NOT NULL
    UNION ALL SELECT 'forbidden', '', '', message, '' FROM function_violations
    UNION ALL SELECT 'forbidden', '', '', message, '' FROM remote_violations
    UNION ALL SELECT 'parser', coalesce(error_type, ''), coalesce(error_subtype, ''), coalesce(error_message, ''), coalesce(position, '')
    FROM root WHERE error_is_bool AND error = 'true'
    UNION ALL SELECT 'unsupported', 'not implemented', '', 'invalid SQL parser response: missing error status', ''
    FROM root WHERE NOT error_is_bool
    UNION ALL SELECT 'unsupported', 'not implemented', '', 'invalid validation policy', ''
    FROM root WHERE @@check_functions@@ AND system.main.len(@@blocked_functions@@) > 0
    UNION ALL SELECT 'ok', '', '', '', '' FROM root WHERE error_is_bool AND error = 'false'
),
distinct_results AS (
    SELECT *,
        system.main.lag(system.main.struct_pack(code, error_type, error_subtype, message, position))
            OVER (ORDER BY code, message, error_type, error_subtype, position) AS previous,
        system.main.count(*) OVER () AS total
    FROM results
)
SELECT code, error_type, error_subtype, message, position
FROM distinct_results
WHERE previous IS DISTINCT FROM system.main.struct_pack(code, error_type, error_subtype, message, position)
    AND (code != 'ok' OR total = 1)
ORDER BY code, message;
