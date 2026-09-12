-- DuckDB v1.5.5 serialization contract: https://github.com/duckdb/duckdb/tree/v1.5.5/src/include/duckdb/storage/serialization
WITH
parsed AS MATERIALIZED (
    SELECT system.main.json_serialize_sql(
        $query::VARCHAR, skip_default := true, skip_empty := true, skip_null := true
    ) AS ast
),
policy AS (
    SELECT $check_schemas::BOOLEAN AS check_schemas,
        coalesce($allowed_schemas::VARCHAR[], []) AS allowed_schemas,
        coalesce($blocked_functions::VARCHAR[], []) AS blocked_functions,
        $check_functions::BOOLEAN AS check_functions,
        coalesce($allowed_functions::VARCHAR[], []) AS allowed_functions,
        $reject_remote_uris::BOOLEAN AS reject_remote_uris,
        $remote_readers::JSON AS remote_readers
),
grammar(kind, fields, required) AS (
    VALUES
    ('root', '{"error":"BOOLEAN","statements":"statement[]"}', ['error', 'statements']),
    ('statement', '{"node":"query","named_param_map":"opaque"}', ['node']),
    ('SELECT_NODE', '{"type":"VARCHAR","modifiers":"modifier[]","cte_map":"cte_map","select_list":"expression[]","from_table":"table","where_clause":"expression","group_expressions":"expression[]","group_sets":"opaque","aggregate_handling":"VARCHAR","having":"expression","sample":"sample","qualify":"expression"}', ['type', 'select_list', 'from_table']),
    ('SET_OPERATION_NODE', '{"type":"VARCHAR","modifiers":"modifier[]","cte_map":"cte_map","setop_type":"VARCHAR","left":"query","right":"query","children":"query[]","setop_all":"BOOLEAN"}', ['type', 'left', 'right', 'setop_type']),
    ('RECURSIVE_CTE_NODE', '{"type":"VARCHAR","modifiers":"modifier[]","cte_map":"cte_map","cte_name":"VARCHAR","union_all":"BOOLEAN","left":"query","right":"query","aliases":"VARCHAR[]","key_targets":"expression[]"}', ['type', 'cte_name', 'left', 'right']),
    ('cte_map', '{"map":"cte_entry[]"}', []),
    ('cte_entry', '{"key":"VARCHAR","value":"cte_info"}', ['key', 'value']),
    ('cte_info', '{"aliases":"VARCHAR[]","query":"statement","materialized":"VARCHAR","key_targets":"expression[]"}', ['query']),
    ('BASE_TABLE', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","schema_name":"VARCHAR","table_name":"VARCHAR","column_name_alias":"VARCHAR[]","catalog_name":"VARCHAR","at_clause":"at_clause"}', ['type', 'table_name']),
    ('JOIN', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","left":"table","right":"table","condition":"expression","join_type":"VARCHAR","ref_type":"VARCHAR","using_columns":"VARCHAR[]","delim_flipped":"BOOLEAN","duplicate_eliminated_columns":"expression[]","is_implicit":"BOOLEAN"}', ['type', 'left', 'right']),
    ('SUBQUERY', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","subquery":"statement","column_name_alias":"VARCHAR[]"}', ['type', 'subquery']),
    ('TABLE_FUNCTION', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","function":"expression","column_name_alias":"VARCHAR[]","with_ordinality":"VARCHAR"}', ['type', 'function']),
    ('EMPTY', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number"}', ['type']),
    ('EXPRESSION_LIST', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","expected_names":"VARCHAR[]","expected_types":"opaque","values":"expression[][]"}', ['type', 'values']),
    ('PIVOT', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","source":"table","aggregates":"expression[]","unpivot_names":"VARCHAR[]","pivots":"pivot_column[]","groups":"VARCHAR[]","column_name_alias":"VARCHAR[]","include_nulls":"BOOLEAN"}', ['type', 'source']),
    ('SHOW_REF', '{"type":"VARCHAR","alias":"VARCHAR","sample":"sample","query_location":"number","table_name":"VARCHAR","query":"query","show_type":"VARCHAR","catalog_name":"VARCHAR","schema_name":"VARCHAR"}', ['type', 'show_type']),
    ('at_clause', '{"unit":"VARCHAR","expr":"expression"}', ['unit', 'expr']),
    ('pivot_column', '{"pivot_expressions":"expression[]","unpivot_names":"VARCHAR[]","entries":"pivot_entry[]","pivot_enum":"VARCHAR"}', []),
    ('pivot_entry', '{"values":"opaque","star_expr":"expression","alias":"VARCHAR"}', []),
    ('sample', '{"sample_size":"opaque","is_percentage":"BOOLEAN","method":"VARCHAR","seed":"number"}', ['sample_size']),
    ('LIMIT_MODIFIER', '{"type":"VARCHAR","limit":"expression","offset":"expression"}', ['type']),
    ('LIMIT_PERCENT_MODIFIER', '{"type":"VARCHAR","limit":"expression","offset":"expression"}', ['type']),
    ('DISTINCT_MODIFIER', '{"type":"VARCHAR","distinct_on_targets":"expression[]"}', ['type']),
    ('ORDER_MODIFIER', '{"type":"VARCHAR","orders":"order[]"}', ['type']),
    ('order', '{"type":"VARCHAR","null_order":"VARCHAR","expression":"expression"}', ['expression']),
    ('case_check', '{"when_expr":"expression","then_expr":"expression"}', ['when_expr', 'then_expr']),
    ('replacement', '{"key":"VARCHAR","value":"expression"}', ['key', 'value'])
),
expression_grammar(class, fields, required, types) AS (
    VALUES
    ('BETWEEN', '{"input":"expression","lower":"expression","upper":"expression"}', ['input', 'lower', 'upper'], ['COMPARE_BETWEEN', 'COMPARE_NOT_BETWEEN']),
    ('CASE', '{"case_checks":"case_check[]","else_expr":"expression"}', ['else_expr'], ['CASE_EXPR']),
    ('CAST', '{"child":"expression","cast_type":"opaque","try_cast":"BOOLEAN"}', ['child', 'cast_type'], ['OPERATOR_CAST']),
    ('COLLATE', '{"child":"expression","collation":"VARCHAR"}', ['child', 'collation'], ['COLLATE']),
    ('COLUMN_REF', '{"column_names":"VARCHAR[]"}', ['column_names'], ['COLUMN_REF']),
    ('COMPARISON', '{"left":"expression","right":"expression"}', ['left', 'right'], ['COMPARE_EQUAL', 'COMPARE_NOTEQUAL', 'COMPARE_LESSTHAN', 'COMPARE_GREATERTHAN', 'COMPARE_LESSTHANOREQUALTO', 'COMPARE_GREATERTHANOREQUALTO', 'COMPARE_DISTINCT_FROM', 'COMPARE_NOT_DISTINCT_FROM']),
    ('CONJUNCTION', '{"children":"expression[]"}', ['children'], ['CONJUNCTION_AND', 'CONJUNCTION_OR']),
    ('CONSTANT', '{"value":"opaque"}', ['value'], ['VALUE_CONSTANT']),
    ('FUNCTION', '{"function_name":"VARCHAR","schema":"VARCHAR","children":"expression[]","filter":"expression","order_bys":"modifier","distinct":"BOOLEAN","is_operator":"BOOLEAN","export_state":"BOOLEAN","catalog":"VARCHAR"}', ['function_name'], ['FUNCTION']),
    ('LAMBDA', '{"lhs":"expression","expr":"expression","syntax_type":"VARCHAR"}', ['lhs', 'expr'], ['LAMBDA']),
    ('OPERATOR', '{"children":"expression[]"}', ['children'], ['OPERATOR_NOT', 'OPERATOR_IS_NULL', 'OPERATOR_IS_NOT_NULL', 'OPERATOR_UNPACK', 'COMPARE_IN', 'COMPARE_NOT_IN', 'GROUPING_FUNCTION', 'OPERATOR_COALESCE', 'ARRAY_EXTRACT', 'ARRAY_SLICE', 'STRUCT_EXTRACT', 'ARRAY_CONSTRUCTOR', 'ARROW', 'OPERATOR_TRY']),
    ('PARAMETER', '{"identifier":"VARCHAR"}', ['identifier'], ['VALUE_PARAMETER']),
    ('POSITIONAL_REFERENCE', '{"index":"number"}', ['index'], ['POSITIONAL_REFERENCE']),
    ('STAR', '{"relation_name":"VARCHAR","exclude_list":"opaque","replace_list":"replacement[]","columns":"BOOLEAN","expr":"expression","unpacked":"BOOLEAN","qualified_exclude_list":"opaque","rename_list":"opaque"}', [], ['STAR']),
    ('SUBQUERY', '{"subquery_type":"VARCHAR","subquery":"statement","child":"expression","comparison_type":"VARCHAR"}', ['subquery', 'subquery_type'], ['SUBQUERY']),
    ('WINDOW', '{"function_name":"VARCHAR","schema":"VARCHAR","catalog":"VARCHAR","children":"expression[]","partitions":"expression[]","orders":"order[]","start":"VARCHAR","end":"VARCHAR","start_expr":"expression","end_expr":"expression","offset_expr":"expression","default_expr":"expression","ignore_nulls":"BOOLEAN","filter_expr":"expression","exclude_clause":"VARCHAR","distinct":"BOOLEAN","arg_orders":"order[]"}', ['function_name'], ['WINDOW_AGGREGATE', 'WINDOW_RANK', 'WINDOW_RANK_DENSE', 'WINDOW_NTILE', 'WINDOW_PERCENT_RANK', 'WINDOW_CUME_DIST', 'WINDOW_ROW_NUMBER', 'WINDOW_FIRST_VALUE', 'WINDOW_LAST_VALUE', 'WINDOW_LEAD', 'WINDOW_LAG', 'WINDOW_NTH_VALUE', 'WINDOW_FILL'])
),
rules AS MATERIALIZED (
    SELECT kind, fields::JSON AS fields, required FROM grammar
    UNION ALL
    SELECT 'expression:' || class,
        system.main.json_merge_patch(fields::JSON, '{"class":"VARCHAR","type":"VARCHAR","alias":"VARCHAR","query_location":"number"}'),
        system.main.list_concat(['class', 'type'], required)
    FROM expression_grammar
),
tree AS MATERIALIZED (
    SELECT t.* FROM parsed, system.main.json_tree(ast) t
    WHERE (ast->>'error') = 'false'
),
objects AS MATERIALIZED (
    SELECT t.id, t.value, t.fullkey,
        CASE
            WHEN t.parent IS NULL THEN 'root'
            WHEN (t.value->>'class') IS NOT NULL THEN 'expression:' || (t.value->>'class')
            WHEN system.main.json_type(t.value, 'type') = 'VARCHAR' AND p.key != 'orders' AND p.key != 'arg_orders' THEN t.value->>'type'
            WHEN t.key IN ('query', 'subquery') OR p.key = 'statements' THEN 'statement'
            WHEN t.key = 'cte_map' THEN 'cte_map'
            WHEN p.key = 'map' AND gp.key = 'cte_map' THEN 'cte_entry'
            WHEN t.key = 'value' AND gp.key = 'map' THEN 'cte_info'
            WHEN t.key IN ('sample', 'at_clause') THEN t.key
            WHEN p.key IN ('orders', 'arg_orders') THEN 'order'
            WHEN p.key = 'case_checks' THEN 'case_check'
            WHEN p.key = 'pivots' THEN 'pivot_column'
            WHEN p.key = 'entries' THEN 'pivot_entry'
            WHEN p.key = 'replace_list' THEN 'replacement'
        END AS kind
    FROM tree t
    LEFT JOIN tree p ON p.id = t.parent
    LEFT JOIN tree gp ON gp.id = p.parent
    WHERE t.type = 'OBJECT'
),
-- The grammar nests arrays at most twice; object edges are checked independently of AST depth.
edges AS MATERIALIZED (
    SELECT t.*,
        CASE WHEN t.parent IS NULL THEN 'root'
            WHEN p.type = 'OBJECT' THEN system.main.json_extract_string(r.fields, '/' || t.key)
            WHEN p.type = 'ARRAY' AND gp.type = 'OBJECT' THEN
                system.main.regexp_extract(system.main.json_extract_string(r.fields, '/' || p.key), '^(.*)\[\]$', 1)
            WHEN p.type = 'ARRAY' AND gp.type = 'ARRAY' AND ggp.type = 'OBJECT' THEN
                system.main.regexp_extract(system.main.json_extract_string(r.fields, '/' || gp.key), '^(.*)\[\]\[\]$', 1)
        END AS expected
    FROM tree t
    LEFT JOIN tree p ON p.id = t.parent
    LEFT JOIN tree gp ON gp.id = p.parent
    LEFT JOIN tree ggp ON ggp.id = gp.parent
    LEFT JOIN objects owner ON owner.id = CASE
        WHEN p.type = 'OBJECT' THEN p.id
        WHEN gp.type = 'OBJECT' THEN gp.id
        WHEN ggp.type = 'OBJECT' THEN ggp.id END
    LEFT JOIN rules r ON r.kind = owner.kind
),
walk AS MATERIALIZED (
    SELECT e.* FROM edges e
    WHERE NOT EXISTS (
        SELECT 1 FROM edges data
        WHERE data.expected = 'opaque' AND e.id > data.id
            AND (system.main.starts_with(e.fullkey, data.fullkey || '.')
                OR system.main.starts_with(e.fullkey, data.fullkey || '['))
    )
),
invalid AS (
    SELECT w.fullkey,
        'unsupported SQL AST at ' || w.fullkey || ' (expected ' ||
        coalesce(w.expected, 'known field') || ')' AS message
    FROM walk w
    LEFT JOIN objects o ON o.id = w.id
    LEFT JOIN rules r ON r.kind = o.kind
    WHERE NOT coalesce(CASE
        WHEN w.expected = 'opaque' THEN true
        WHEN system.main.ends_with(w.expected, '[]') THEN w.type = 'ARRAY'
        WHEN w.expected IN ('VARCHAR', 'BOOLEAN') THEN w.type = w.expected
        WHEN w.expected = 'number' THEN w.type IN ('UBIGINT', 'BIGINT', 'DOUBLE')
        ELSE w.type = 'OBJECT' AND r.kind IS NOT NULL
            AND system.main.list_has_all(system.main.json_keys(w.value), r.required)
            AND CASE r.kind
                WHEN 'SHOW_REF' THEN (w.value->>'show_type') IN ('SHOW_FROM', 'SHOW_UNQUALIFIED', 'DESCRIBE', 'SUMMARY')
                WHEN 'SET_OPERATION_NODE' THEN (w.value->>'setop_type') IN ('UNION', 'EXCEPT', 'INTERSECT', 'UNION_BY_NAME')
                ELSE true END
            AND CASE w.expected
                WHEN 'query' THEN r.kind IN ('SELECT_NODE', 'SET_OPERATION_NODE', 'RECURSIVE_CTE_NODE')
                WHEN 'table' THEN r.kind IN ('BASE_TABLE', 'JOIN', 'SUBQUERY', 'TABLE_FUNCTION', 'EMPTY', 'EXPRESSION_LIST', 'PIVOT', 'SHOW_REF')
                WHEN 'modifier' THEN r.kind IN ('LIMIT_MODIFIER', 'LIMIT_PERCENT_MODIFIER', 'DISTINCT_MODIFIER', 'ORDER_MODIFIER')
                WHEN 'expression' THEN EXISTS (
                    SELECT 1 FROM expression_grammar e
                    WHERE e.class = (w.value->>'class') AND system.main.list_contains(e.types, w.value->>'type')
                )
                ELSE r.kind = w.expected END
        END, false)
),
ctes AS MATERIALIZED (
    SELECT entry.id, entry.fullkey, system.main.translate(entry.value->>'key', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz') AS name,
        owner.fullkey AS scope,
        entry.value->'value'->'query'->'node' AS body
    FROM walk entry
    JOIN tree arr ON arr.id = entry.parent
    JOIN tree cte_map ON cte_map.id = arr.parent
    JOIN tree owner ON owner.id = cte_map.parent
    WHERE entry.expected = 'cte_entry'
),
refs AS (
    SELECT w.*, w.value->>'type' AS node_type, w.value->>'class' AS node_class,
        system.main.regexp_replace(coalesce(w.value->>'schema_name', ''), '^schema_name:', '') AS schema_name,
        w.value->>'table_name' AS table_name,
        system.main.lower(w.value->>'function_name') AS function_name
    FROM walk w WHERE w.expected IN ('table', 'expression')
),
violations AS (
    SELECT fullkey, CASE
        WHEN node_class IN ('FUNCTION', 'WINDOW') AND (value->>'catalog') IS NOT NULL THEN
            'access to catalog ''' || system.main.regexp_replace(value->>'catalog', '^catalog:', '') || ''' is not allowed'
        WHEN node_type IN ('BASE_TABLE', 'SHOW_REF') AND (value->>'catalog_name') IS NOT NULL THEN
            'access to catalog ''' || system.main.regexp_replace(value->>'catalog_name', '^catalog_name:', '') || ''' is not allowed'
        WHEN node_type = 'SHOW_REF' AND (value->'query') IS NULL AND schema_name = '' THEN
            'SHOW statement requires an explicit authorized schema'
        WHEN (node_type = 'BASE_TABLE' OR (node_type = 'SHOW_REF' AND (value->'query') IS NULL))
            AND schema_name != '' AND NOT system.main.list_contains(p.allowed_schemas, schema_name) THEN
            'unauthorized access to schema ''' || schema_name || ''''
        WHEN node_type = 'BASE_TABLE' AND schema_name = '' AND NOT EXISTS (
            SELECT 1 FROM ctes c
            WHERE c.name = system.main.translate(r.table_name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')
                AND system.main.starts_with(r.fullkey, c.scope || '.')
                AND (
                    NOT system.main.starts_with(r.fullkey, c.scope || '.cte_map.')
                    OR EXISTS (
                        SELECT 1 FROM ctes sibling
                        WHERE sibling.scope = c.scope AND sibling.id > c.id
                            AND system.main.starts_with(r.fullkey, sibling.fullkey || '.')
                    )
                    OR ((c.body->>'type') = 'RECURSIVE_CTE_NODE'
                        AND system.main.starts_with(r.fullkey, c.fullkey || '.value.query.node.right.'))
                )
        ) THEN 'unauthorized access to table ''' || table_name || ''' with empty schema'
        END AS message
    FROM refs r, policy p WHERE p.check_schemas
),
function_violations AS (
    SELECT function_name, CASE WHEN p.check_functions
        THEN 'function ''' || function_name || ''' is not in the allowlist'
        ELSE 'use of function ''' || function_name || ''' is not allowed' END
        || CASE WHEN count(*) > 1 THEN ' (' || count(*)::VARCHAR || ' occurrences)' ELSE '' END AS message
    FROM refs, policy p
    WHERE node_class IN ('FUNCTION', 'WINDOW') AND (
        system.main.list_contains(p.blocked_functions, function_name)
        OR (p.check_functions AND NOT system.main.list_contains(p.allowed_functions, function_name))
    )
    GROUP BY function_name, p.check_functions
),
remote_prefixes(prefix) AS (
    VALUES ('http://'), ('https://'), ('s3://'), ('s3a://'), ('s3n://'), ('gcs://'), ('gs://'),
        ('r2://'), ('hf://'), ('azure://'), ('az://'), ('abfs://'), ('abfss://')
),
table_arguments AS (
    SELECT f.function_name, arg.fullkey, arg.value,
        system.main.lower(coalesce(arg.value->>'alias', '')) AS name,
        count(*) FILTER (WHERE coalesce(arg.value->>'alias', '') = '')
            OVER (PARTITION BY f.id ORDER BY arg.id) - 1 AS position
    FROM refs f
    JOIN walk args ON args.parent = f.id AND args.key = 'children'
    JOIN walk arg ON arg.parent = args.id
    JOIN walk tbl ON tbl.id = f.parent AND (tbl.value->>'type') = 'TABLE_FUNCTION'
    CROSS JOIN policy p WHERE p.reject_remote_uris
),
remote_violations AS (
    SELECT 'remote URI prefix ''' || prefix || ''' is not allowed in replacement scan' AS message
    FROM refs, remote_prefixes, policy p
    WHERE p.reject_remote_uris AND node_type = 'BASE_TABLE'
        AND system.main.contains(system.main.lower(table_name), prefix)
    UNION ALL
    SELECT 'nested SQL executor ''' || function_name || ''' is not allowed'
    FROM refs r, policy p
    WHERE p.reject_remote_uris AND node_class = 'FUNCTION' AND (
        (r.key = 'function' AND function_name IN ('query', 'json_execute_serialized_sql'))
        OR (r.key != 'function' AND function_name = 'json_serialize_plan'
            AND system.main.lower(coalesce(value->>'catalog', '')) IN ('', 'system')
            AND system.main.lower(coalesce(value->>'schema', '')) IN ('', 'main', 'system'))
    )
    UNION ALL
    SELECT 'remote URI prefix ''' || prefix || ''' is not allowed in path argument to function ''' || arg.function_name || ''''
    FROM table_arguments arg
    JOIN walk literal ON (literal.value->>'class') = 'CONSTANT'
        AND (literal.fullkey = arg.fullkey OR system.main.starts_with(literal.fullkey, arg.fullkey || '.'))
    CROSS JOIN remote_prefixes
    CROSS JOIN policy p
    WHERE system.main.contains(system.main.lower(literal.value->'value'->>'value'), prefix)
        AND EXISTS (
            SELECT 1 FROM system.main.json_each(p.remote_readers) reader
            WHERE reader.key = arg.function_name AND (
                (arg.name = '' AND system.main.list_contains((reader.value->'Positional')::BIGINT[], arg.position))
                OR (arg.name != '' AND system.main.list_contains((reader.value->'Named')::VARCHAR[], arg.name))
            )
        )
),
errors AS (
    SELECT 'unsupported' AS code, 'not implemented' AS error_type, '' AS error_subtype, message, '' AS position
    FROM invalid
    UNION ALL
    SELECT 'forbidden', '', '', message, '' FROM violations WHERE message IS NOT NULL
    UNION ALL
    SELECT 'forbidden', '', '', message, '' FROM function_violations
    UNION ALL
    SELECT 'forbidden', '', '', message, '' FROM remote_violations
    UNION ALL
    SELECT 'unsupported', 'not implemented', '', 'invalid validation policy', '' FROM policy
    WHERE check_schemas IS NULL OR check_functions IS NULL OR reject_remote_uris IS NULL
        OR (check_functions AND system.main.len(blocked_functions) > 0)
        OR (reject_remote_uris AND system.main.json_type(remote_readers) IS DISTINCT FROM 'OBJECT')
),
result AS (
    SELECT * FROM errors
    UNION ALL
    SELECT 'parser', coalesce(ast->>'error_type', ''), coalesce(ast->>'error_subtype', ''),
        coalesce(ast->>'error_message', ''), coalesce(ast->>'position', '')
    FROM parsed WHERE (ast->>'error') = 'true'
    UNION ALL
    SELECT 'unsupported', 'not implemented', '', 'invalid SQL parser response: missing error status', ''
    FROM parsed WHERE system.main.json_type(ast, 'error') IS DISTINCT FROM 'BOOLEAN'
    UNION ALL
    SELECT 'ok', '', '', '', '' FROM parsed
    WHERE (ast->>'error') = 'false' AND NOT EXISTS (SELECT 1 FROM errors)
)
SELECT DISTINCT code, error_type, error_subtype, message, position
FROM result ORDER BY code, message;
