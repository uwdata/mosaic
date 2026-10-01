import {
  AggregateNode,
  CastNode,
  CollateNode,
  CreateQuery,
  CreateSchemaQuery,
  PivotQuery,
  SampleClauseNode,
  UnnestNode,
  WindowFunctionNode,
  isQuery
} from '../../ast/index.js';
import { SQLDialectCodeGenerator } from './dialect.js';
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
    const { expr, cast } = node;
    return `(${this.toString(expr)})::${cast}`;
  }

  visitCollate(node: CollateNode): string {
    const { expr, collation } = node;
    return `${this.toString(expr)} COLLATE ${collation}`;
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

  visitSampleClause(node: SampleClauseNode): string {
    const { size, perc, method, seed } = node;
    const m = method ? `${method} ` : '';
    const s = seed != null ? ` REPEATABLE (${seed})` : '';
    return `${m}(${size}${perc ? '%' : ' ROWS'})${s}`;
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

// Create a default DuckDB visitor instance for convenience
export const duckDBCodeGenerator = new DuckDBCodeGenerator();
