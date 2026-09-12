import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parent
DUCKDB = 'd8cdaa33fda8df955cc76ef58a280f68f4cd43fa'
YYJSON = '8b4a38dc994a110abaec8a400615567bd996105f'


def fetch(repo, revision, path, destination):
    url = f'https://raw.githubusercontent.com/{repo}/{revision}/{path}'
    if not destination.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            destination.write_bytes(response.read())
    return destination.read_bytes()


def grammar(specs):
    primitive = {
        'string': 'string', 'bool': 'boolean', 'optional_idx': 'number',
        'idx_t': 'number', 'int64_t': 'number', 'Value': 'opaque',
        'LogicalType': 'opaque', 'GroupingSet': 'opaque',
        'case_insensitive_set_t': 'opaque', 'qualified_column_set_t': 'opaque',
        'qualified_column_map_t<string>': 'opaque',
        'case_insensitive_map_t<idx_t>': 'opaque',
        'case_insensitive_map_t<ParsedExpression*>': 'replacement[]',
        'InsertionOrderPreservingMap<CommonTableExpressionInfo*>': 'CommonTableExpressionInfoEntry[]',
    }
    enums = {'QueryNodeType', 'AggregateHandling', 'SetOperationType', 'CTEMaterialize',
             'TableReferenceType', 'JoinType', 'JoinRefType', 'OrdinalityType', 'ShowType',
             'ResultModifierType', 'OrderType', 'OrderByNullType', 'SampleMethod',
             'ExpressionClass', 'ExpressionType', 'LambdaSyntaxType', 'SubqueryType',
             'WindowBoundary', 'WindowExcludeMode'}
    allowed = {
        'SelectStatement', 'QueryNode', 'SelectNode', 'SetOperationNode', 'RecursiveCTENode',
        'TableRef', 'BaseTableRef', 'JoinRef', 'SubqueryRef', 'TableFunctionRef', 'EmptyTableRef',
        'ExpressionListRef', 'PivotRef', 'ShowRef', 'AtClause', 'ParsedExpression',
        'BetweenExpression', 'CaseExpression', 'CastExpression', 'CollateExpression',
        'ColumnRefExpression', 'ComparisonExpression', 'ConjunctionExpression', 'ConstantExpression',
        'FunctionExpression', 'LambdaExpression', 'OperatorExpression', 'ParameterExpression',
        'PositionalReferenceExpression', 'StarExpression', 'SubqueryExpression', 'WindowExpression',
        'CommonTableExpressionInfo', 'CommonTableExpressionMap', 'OrderByNode', 'CaseCheck',
        'SampleOptions', 'PivotColumn', 'PivotColumnEntry', 'ResultModifier',
        'LimitModifier', 'DistinctModifier', 'OrderModifier', 'LimitPercentModifier',
    }
    entries = {entry['class']: entry for spec in specs for entry in spec if entry['class'] in allowed}

    def resolve(typ):
        if typ in primitive:
            return primitive[typ]
        if typ in enums:
            return 'string'
        if typ.endswith('*'):
            return resolve(typ[:-1])
        if typ.startswith('unique_ptr<'):
            return resolve(typ[11:-1])
        if typ.startswith('vector<'):
            return resolve(typ[7:-1]) + '[]'
        if typ in allowed:
            return typ
        raise ValueError(f'unreviewed field type: {typ}')

    rules = {}
    for name, entry in entries.items():
        fields = {}
        if 'base' in entry:
            fields.update({m['name']: resolve(m['type']) for m in entries[entry['base']]['members']})
        fields.update({m['name']: resolve(m['type']) for m in entry['members'] if m.get('status') != 'deleted'})
        if name == 'SetOperationNode':
            fields.pop('children', None)
        rules[name] = {'fields': fields, 'required': []}
    rules['root'] = {'fields': {'error': 'boolean', 'statements': 'SelectStatement[]'}, 'required': ['error', 'statements']}
    rules['CommonTableExpressionInfoEntry'] = {'fields': {'key': 'string', 'value': 'CommonTableExpressionInfo'}, 'required': ['key', 'value']}
    rules['replacement'] = {'fields': {'key': 'string', 'value': 'ParsedExpression'}, 'required': ['key', 'value']}
    required = {
        'SelectStatement': ['node'], 'SelectNode': ['type', 'select_list', 'from_table'],
        'SetOperationNode': ['type', 'setop_type', 'left', 'right'],
        'RecursiveCTENode': ['type', 'cte_name', 'left', 'right'],
        'CommonTableExpressionInfo': ['query'], 'BaseTableRef': ['type', 'table_name'],
        'JoinRef': ['type', 'left', 'right'], 'SubqueryRef': ['type', 'subquery'],
        'TableFunctionRef': ['type', 'function'], 'EmptyTableRef': ['type'],
        'ExpressionListRef': ['type', 'values'], 'PivotRef': ['type', 'source'],
        'ShowRef': ['type', 'show_type'], 'AtClause': ['unit', 'expr'],
        'OrderByNode': ['expression'], 'CaseCheck': ['when_expr', 'then_expr'],
        'SampleOptions': ['sample_size'], 'ConstantExpression': ['value'],
        'FunctionExpression': ['function_name'], 'WindowExpression': ['function_name'],
        'SubqueryExpression': ['subquery', 'subquery_type'],
        'BetweenExpression': ['input', 'lower', 'upper'],
        'CaseExpression': ['else_expr'], 'CastExpression': ['child', 'cast_type'],
        'CollateExpression': ['child', 'collation'], 'ColumnRefExpression': ['column_names'],
        'ComparisonExpression': ['left', 'right'], 'ConjunctionExpression': ['children'],
        'LambdaExpression': ['lhs', 'expr'], 'OperatorExpression': ['children'],
        'ParameterExpression': ['identifier'], 'PositionalReferenceExpression': ['index'],
    }
    for name, rule in rules.items():
        rule['required'] = required.get(name, rule['required'])
        if entries.get(name, {}).get('base') == 'ParsedExpression':
            rule['required'] += ['class', 'type']
    dispatch = {}
    for name, entry in entries.items():
        if 'base' in entry:
            enum = entry['enum']
            if enum == 'EMPTY_FROM':
                enum = 'EMPTY'
            dispatch.setdefault(entry['base'], {})[enum] = name
    return {'rules': rules, 'dispatch': dispatch}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--duckdb', default='duckdb')
    args = parser.parse_args()
    build = ROOT / 'build'
    build.mkdir(exist_ok=True)
    include = build / 'include'
    include.mkdir(exist_ok=True)
    for file in ['duckdb.h', 'duckdb_extension.h']:
        fetch('duckdb/duckdb', DUCKDB, 'src/include/' + file, include / file)
    for file in ['yyjson.h', 'yyjson.c']:
        fetch('ibireme/yyjson', YYJSON, 'src/' + file, include / file)
    for repo, rev, name in [('duckdb/duckdb', DUCKDB, 'duckdb'), ('ibireme/yyjson', YYJSON, 'yyjson')]:
        fetch(repo, rev, 'LICENSE', build / (name + '-LICENSE'))
    specs = []
    for name in ['statement', 'query_node', 'tableref', 'parsed_expression', 'result_modifier', 'nodes']:
        data = fetch('duckdb/duckdb', DUCKDB, f'src/include/duckdb/storage/serialization/{name}.json', build / (name + '.json'))
        specs.append(json.loads(data))
    (include / 'grammar.hpp').write_text('static const char *grammar_json = R"GRAMMAR(' + json.dumps(grammar(specs), separators=(',', ':')) + ')GRAMMAR";\n')
    output = build / 'mosaic_validation.duckdb_extension'
    subprocess.run([os.environ.get('CC', 'cc'), '-O3', '-fPIC', '-fvisibility=hidden', '-I' + str(include), '-c', str(include / 'yyjson.c'), '-o', str(build / 'yyjson.o')], check=True)
    flags = ['-dynamiclib'] if platform.system() == 'Darwin' else ['-shared']
    subprocess.run([os.environ.get('CXX', 'c++'), '-std=c++17', '-O3', '-fPIC', '-fvisibility=hidden', *flags, '-I' + str(include), str(ROOT / 'validation.cpp'), str(build / 'yyjson.o'), '-o', str(output)], check=True)
    host = json.loads(subprocess.check_output([args.duckdb, '-init', '/dev/null', '-json', '-c', 'PRAGMA platform;'], text=True))[0]['platform']
    fields = ['4', host, 'v1.2.0', '0.0.1', 'C_STRUCT', '', '', '']
    metadata = b'\x00\x93\x04\x10duckdb_signature\x80\x04' + b''.join(s.encode().ljust(32, b'\0') for s in reversed(fields)) + bytes(256)
    with output.open('ab') as f:
        f.write(metadata)
    print(output)
    print('sha256:', hashlib.sha256(output.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
