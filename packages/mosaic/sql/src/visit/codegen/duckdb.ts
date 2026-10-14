import {
  AggregateNode,
  CastNode,
  CollateNode,
  ColumnsNode,
  CreateQuery,
  CreateSchemaQuery,
  ExprNode,
  LambdaNode,
  LambdaVarNode,
  NamedArgNode,
  PivotQuery,
  QuantifiedOpNode,
  SampleClauseNode,
  SliceNode,
  SubscriptNode,
  UnnestNode,
  WindowFunctionNode,
  isQuery
} from '../../ast/index.js';
import { COLUMN_PARAM, COLUMN_REF, FUNCTION, LIST, SLICE, SUBSCRIPT } from '../../constants.js';
import { quoteIdentifier } from '../../util/string.js';
import { SQLDialectCodeGenerator } from './dialect.js';
import type { SQLCodeGenerator } from './sql.js';
import type { ColumnDescription, JSType } from '../../types.js';

/**
 * DuckDB SQL dialect visitor for converting AST nodes to DuckDB-compatible SQL.
 */
export class DuckDBCodeGenerator extends SQLDialectCodeGenerator {
  protected dateTimeToSQL(timestamp: number): string {
    return `epoch_ms(${timestamp})`;
  }

  visitAggregate(node: AggregateNode): string {
    const { name, args, isDistinct, filter, order } = node;
    const arg = [
      isDistinct ? 'DISTINCT' : '',
      args?.length ? this.mapToString(args).join(', ')
        : name.toLowerCase() === 'count' ? '*'
        : '',
      order.length ? `ORDER BY ${this.mapToString(order).join(', ')}` : ''
    ].filter(x => x).join(' ');
    const filt = filter ? ` FILTER (WHERE ${this.toString(filter)})` : '';
    return `${name}(${arg})${filt}`;
  }

  visitCast(node: CastNode): string {
    const { expr, cast, isTry } = node;
    return isTry
      ? `TRY_CAST(${this.toString(expr)} AS ${cast})`
      : `(${this.toString(expr)})::${cast}`;
  }

  visitCollate(node: CollateNode): string {
    const { expr, collation } = node;
    return `${this.toString(expr)} COLLATE ${collation}`;
  }

  visitColumns(node: ColumnsNode): string {
    const { selector, unpack } = node;
    return `${unpack ? '*' : ''}COLUMNS(${this.toString(selector)})`;
  }

  visitCreateQuery(node: CreateQuery): string {
    const { name, query, replace, temp, view } = node;
    return 'CREATE'
      + (replace ? ' OR REPLACE ' : ' ')
      + (temp ? 'TEMP ' : '')
      + (view ? 'VIEW' : 'TABLE')
      + (replace ? ' ' : ' IF NOT EXISTS ')
      + this.toString(name) + ' AS ' + this.toString(query);
  }

  visitCreateSchemaQuery(node: CreateSchemaQuery): string {
    const { name, strict } = node;
    return 'CREATE SCHEMA '
      + (strict ? '' : 'IF NOT EXISTS ')
      + this.toString(name);
  }

  visitLambda(node: LambdaNode): string {
    const { params, body } = node;
    return `lambda ${params.map(p => quoteIdentifier(p)).join(', ')}: ${this.toString(body)}`;
  }

  visitLambdaVar(node: LambdaVarNode): string {
    return quoteIdentifier(node.name);
  }

  visitNamedArg(node: NamedArgNode): string {
    const { name, expr } = node;
    return `${quoteIdentifier(name)} := ${this.toString(expr)}`;
  }

  visitPivotQuery(node: PivotQuery): string {
    const { source, _on, _in, _using, _groupby } = node;

    const ref = isQuery(source) ? `(${this.toString(source)})` : this.toString(source);
    const sql: string[] = [];

    // PIVOT
    sql.push(`PIVOT ${ref}`);

    // ON
    if (_on.length) {
      sql.push(`ON ${this.mapToString(_on).join(', ')}`);
    }

    // IN
    if (_in.length) {
      sql.push(`IN (${this.mapToString(_in).join(', ')})`);
    }

    // USING
    if (_using.length) {
      sql.push(`USING ${this.mapToString(_using).join(', ')}`);
    }

    // GROUP BY
    if (_groupby.length) {
      sql.push(`GROUP BY ${this.mapToString(_groupby).join(', ')}`);
    }

    return this.visitQuery(node, sql);
  }

  visitQuantified(node: QuantifiedOpNode): string {
    const { op, expr, quantifier, subquery } = node;
    return `(${this.toString(expr)} ${op} ${quantifier} ${this.toString(subquery)})`;
  }

  visitSampleClause(node: SampleClauseNode): string {
    const { size, perc, method, seed } = node;
    const m = method ? `${method} ` : '';
    const s = seed != null ? ` REPEATABLE (${seed})` : '';
    return `${m}(${size}${perc ? '%' : ' ROWS'})${s}`;
  }

  visitSlice(node: SliceNode): string {
    const { expr, start, end, step } = node;
    const a = start ? this.toString(start) : '';
    const b = end ? this.toString(end) : step ? '-' : '';
    const c = step ? `:${this.toString(step)}` : '';
    return `${subscriptTarget(this, expr)}[${a}:${b}${c}]`;
  }

  visitSubscript(node: SubscriptNode): string {
    const { expr, index } = node;
    return `${subscriptTarget(this, expr)}[${this.toString(index)}]`;
  }

  visitUnnest(node: UnnestNode): string {
    const { expr, recursive, maxDepth } = node;
    const args = [this.toString(expr)];

    if (recursive) {
      args.push('recursive := true');
    }
    if (maxDepth != null && maxDepth > 0) {
      args.push(`max_depth := ${maxDepth}`);
    }

    return `UNNEST(${args.join(', ')})`;
  }

  visitWindowFunction(node: WindowFunctionNode): string {
    const { name, args, ignoreNulls, order } = node;
    const arg = [
      this.mapToString(args).join(', '),
      order.length ? `ORDER BY ${this.mapToString(order).join(', ')}` : '',
      ignoreNulls ? 'IGNORE NULLS' : ''
    ].filter(x => x).join(' ');
    return `${name}(${arg})`;
  }

  jsType(type: string): JSType {
    switch (type) {
      case 'BIGINT':
      case 'HUGEINT':
      case 'INTEGER':
      case 'SMALLINT':
      case 'TINYINT':
      case 'UBIGINT':
      case 'UINTEGER':
      case 'USMALLINT':
      case 'UTINYINT':
      case 'DOUBLE':
      case 'FLOAT':
      case 'REAL':
        return 'number';
      case 'DATE':
      case 'TIMESTAMP':
      case 'TIMESTAMPTZ':
      case 'TIMESTAMP WITH TIME ZONE':
      case 'TIME':
      case 'TIMESTAMP_MS':
      case 'TIMESTAMP_NS':
        return 'date';
      case 'BOOLEAN':
        return 'boolean';
      case 'VARCHAR':
      case 'UUID':
      case 'JSON':
        return 'string';
      case 'ARRAY':
      case 'LIST':
        return 'array';
      case 'BLOB':
      case 'STRUCT':
      case 'MAP':
      case 'GEOMETRY':
        return 'object';
      default:
        if (type.startsWith('ENUM')) return 'string';
        if (type.startsWith('DECIMAL')) return 'number';
        if (type.startsWith('STRUCT') || type.startsWith('MAP')) return 'object';
        if (type.endsWith(']')) return 'array';
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  normalizeDescribeResult(rows: unknown[]): ColumnDescription[] {
    return rows as ColumnDescription[];
  }
}

const SUBSCRIPTABLE = new Set([COLUMN_PARAM, COLUMN_REF, FUNCTION, LIST, SLICE, SUBSCRIPT]);

function subscriptTarget(visitor: SQLCodeGenerator, expr: ExprNode) {
  const s = visitor.toString(expr);
  return SUBSCRIPTABLE.has(expr.type) ? s : `(${s})`;
}

// Create a default DuckDB visitor instance for convenience
export const duckDBCodeGenerator = new DuckDBCodeGenerator();
