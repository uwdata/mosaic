import {
  AggregateNode,
  BinaryOpNode,
  CastNode,
  CollateNode,
  CreateQuery,
  CreateSchemaQuery,
  FunctionNode,
  JoinNode,
  LiteralNode,
  PivotQuery,
  Query,
  SampleClauseNode,
  SelectClauseNode,
  SelectQuery,
  SetOperation,
  UnaryOpNode,
  UnnestNode,
  ValuesNode,
  WindowFrameNode,
  WindowFunctionNode,
  isColumnRef,
} from '../../ast/index.js';
import { LITERAL } from '../../constants.js';
import { quoteIdentifier } from '../../util/string.js';
import { walk } from '../walk.js';
import { SQLDialectCodeGenerator } from './dialect.js';
import type { ColumnDescription, JSType } from '../../types.js';

/**
 * ClickHouse SQL dialect visitor.
 */
export class ClickHouseCodeGenerator extends SQLDialectCodeGenerator {
  protected dateTimeToSQL(timestamp: number): string {
    return `fromUnixTimestamp64Milli(${timestamp})`;
  }

  visitCast(node: CastNode): string {
    const { expr, cast } = node;
    return `CAST(${this.toString(expr)} AS ${cast})`;
  }

  visitBinary(node: BinaryOpNode): string {
    const left = this.toString(node.left);
    const right = this.toString(node.right);
    switch (node.op) {
      case '**':  return `pow(${left}, ${right})`;
      case '//':  return `intDiv(${left}, ${right})`;
      case '&':   return `bitAnd(${left}, ${right})`;
      case '|':   return `bitOr(${left}, ${right})`;
      case '<<':  return `bitShiftLeft(${left}, ${right})`;
      case '>>':  return `bitShiftRight(${left}, ${right})`;
    }
    return super.visitBinary(node);
  }

  visitUnary(node: UnaryOpNode): string {
    if (node.op === '~') {
      const { expr } = node;
      if (expr.type === LITERAL) {
        const { value } = expr as LiteralNode;
        if (!Number.isInteger(value)) {
          throw new Error(
            `bitNot expects an integer operand in ClickHouse, got ${JSON.stringify(value)}`
          );
        }
      }
      return `bitNot(${this.toString(expr)})`;
    }
    return super.visitUnary(node);
  }

  visitCollate(node: CollateNode): never {
    throw new Error(`${node.type} is not supported.`);
  }

  visitCreateQuery(node: CreateQuery): string {
    const { name, query, replace, temp, view } = node;
    return 'CREATE'
      + (replace ? ' OR REPLACE ' : ' ')
      + (temp ? 'TEMPORARY ' : '')
      + (view ? 'VIEW' : 'TABLE')
      + (replace ? ' ' : ' IF NOT EXISTS ')
      + this.toString(name) + ' AS ' + this.toString(query);
  }

  visitCreateSchemaQuery(node: CreateSchemaQuery): string {
    const { name, strict } = node;
    return 'CREATE DATABASE '
      + (strict ? '' : 'IF NOT EXISTS ')
      + this.toString(name);
  }

  visitPivotQuery(node: PivotQuery): never {
    throw new Error(`${node.type} is not supported.`);
  }

  visitSampleClause(node: SampleClauseNode): never {
    throw new Error(`${node.type} is not supported.`);
  }

  visitUnnest(node: UnnestNode): string {
    const { expr, recursive, maxDepth } = node;
    if (recursive || maxDepth > 0) {
      throw new Error('Recursive UNNEST is not supported.');
    }
    return `UNNEST(${this.toString(expr)})`;
  }

  visitValues(node: ValuesNode): never {
    throw new Error(`${node.type} is not supported.`);
  }

  private unaryArgToString(node: AggregateNode): string {
    const args = node.args ?? [];
    if (args.length !== 1) {
      throw new Error(`${node.name} expects 1 arg, got ${args.length}`);
    }
    return this.toString(args[0]);
  }

  private aggregateToSQL(
    node: AggregateNode,
    name: string = node.name,
    args: string[] = this.mapToString(node.args ?? []),
    params: string[] = []
  ): string {
    const suffix = `${node.isDistinct ? 'Distinct' : ''}${node.filter ? 'If' : ''}`;
    const values = [...args];
    if (!values.length && name.toLowerCase() === 'count' && !node.filter) {
      values.push('*');
    }
    if (node.filter) {
      values.push(this.toString(node.filter));
    }

    const fn = `${name}${suffix}${params.length ? `(${params.join(', ')})` : ''}`;
    return `${fn}(${values.join(', ')})`;
  }

  visitAggregate(node: AggregateNode): string {
    if (node.order.length) {
      throw new Error('Aggregate argument ordering is not supported.');
    }

    const key = node.name.toLowerCase();

    // REGRESSION aggregates
    if (key.startsWith('regr_')) {
      if (node.isDistinct) {
        throw new Error(`DISTINCT is not supported for ${node.name}.`);
      }
      const args = node.args ?? [];
      if (args.length !== 2) {
        throw new Error(`${node.name} expects (y, x), got ${args.length} args`);
      }
      const [y, x] = args;
      const ys = this.toString(y);
      const xs = this.toString(x);
      const bothPresent = `(${ys}) IS NOT NULL AND (${xs}) IS NOT NULL`;
      const f = node.filter
        ? `(${bothPresent}) AND (${this.toString(node.filter)})`
        : bothPresent;
      switch (key) {
        case 'regr_count':
          return `countIf(${f})`;
        case 'regr_avgx':
          return `avgIf(${xs}, ${f})`;
        case 'regr_avgy':
          return `avgIf(${ys}, ${f})`;
        case 'regr_sxx':
          return `(varSampIf(${xs}, ${f}) * (countIf(${f}) - 1))`;
        case 'regr_syy':
          return `(varSampIf(${ys}, ${f}) * (countIf(${f}) - 1))`;
        case 'regr_sxy':
          return `(covarSampIf(${ys}, ${xs}, ${f}) * (countIf(${f}) - 1))`;
        case 'regr_slope':
          return `(covarSampIf(${ys}, ${xs}, ${f}) / varSampIf(${xs}, ${f}))`;
        case 'regr_intercept':
          return `(avgIf(${ys}, ${f}) - (covarSampIf(${ys}, ${xs}, ${f}) / varSampIf(${xs}, ${f})) * avgIf(${xs}, ${f}))`;
        case 'regr_r2':
          return `(pow(corrIf(${ys}, ${xs}, ${f}), 2))`;
        default:
          throw new Error(`unknown regression aggregate: ${node.name}`);
      }
    }

    switch (key) {
      // QUANTILE: quantileExactLow picks a real data point and matches DuckDB
      // on ties and evenly-spaced samples. It may differ by one sorted slot on
      // continuous data.
      case 'quantile': {
        const args = node.args ?? [];
        if (args.length !== 2) {
          throw new Error(`quantile expects (x, p), got ${args.length} args`);
        }
        const [x, p] = args;
        return this.aggregateToSQL(
          node,
          'quantileExactLow',
          [this.toString(x)],
          [this.toString(p)]
        );
      }
      case 'mode': {
        const x = this.unaryArgToString(node);
        return `${this.aggregateToSQL(node, 'topK', [x], ['1'])}[1]`;
      }
      case 'geomean': {
        const x = this.unaryArgToString(node);
        return `exp(${this.aggregateToSQL(node, 'avg', [`ln(${x})`])})`;
      }
      case 'product': {
        const x = this.unaryArgToString(node);
        const arr = this.aggregateToSQL(node, 'groupArray', [x]);
        return `if(empty(${arr}), NULL, arrayProduct(${arr}))`;
      }
      case 'mad': {
        const xs = this.unaryArgToString(node);
        const arr = this.aggregateToSQL(node, 'groupArray', [xs]);
        return `arrayReduce('median', arrayMap(_v -> abs(_v - arrayReduce('median', ${arr})), ${arr}))`;
      }

      // RENAMES
      case 'arg_max':
        return this.aggregateToSQL(node, 'argMax');
      case 'arg_min':
        return this.aggregateToSQL(node, 'argMin');
      case 'approx_count_distinct':
        return this.aggregateToSQL(node, 'uniq');

      // first/last rely on DuckDB's insertion order; CH has no equivalent
      // that survives parallel scans. We can throw with the specific replacement.
      case 'first':
        throw new Error(
          `first(x) is not supported in ClickHouse. Use argmin(x, ordering_col).`
        );
      case 'last':
        throw new Error(
          `last(x) is not supported in ClickHouse. Use argmax(x, ordering_col).`
        );

      default:
        return this.aggregateToSQL(node);
    }
  }

  visitFunction(node: FunctionNode): string {
    const { name, args } = node;
    switch (name.toLowerCase()) {
      // DATETIME
      case 'epoch_ms': {
        const [expr] = args;
        return `toUnixTimestamp64Milli(toDateTime64(${this.toString(expr)}, 3))`;
      }
      case 'time_bucket': {
        const [interval, expr] = args;
        return `toDateTime64(toStartOfInterval(${this.toString(expr)}, ${this.toString(interval)}), 3)`;
      }
      case 'timezone': {
        const [tz, ts] = args;
        return `toTimeZone(${this.toString(ts)}, ${this.toString(tz)})`;
      }
      case 'make_date': return `makeDate(${this.mapToString(args).join(', ')})`;

      // LIST
      case 'list_contains': return `has(${this.mapToString(args).join(', ')})`;
      case 'list_has_any':  return `hasAny(${this.mapToString(args).join(', ')})`;
      case 'list_has_all':  return `hasAll(${this.mapToString(args).join(', ')})`;

      // STRING
      case 'contains':    return `(position(${this.mapToString(args).join(', ')}) > 0)`;
      case 'starts_with': return `startsWith(${this.mapToString(args).join(', ')})`;
      case 'ends_with':   return `endsWith(${this.mapToString(args).join(', ')})`;
      case 'regexp_matches':
        if (args.length !== 2) {
          throw new Error('Regular expression options are not supported.');
        }
        return `match(${this.mapToString(args).join(', ')})`;

      // NUMERIC
      case 'isnan':     return `isNaN(${this.mapToString(args).join(', ')})`;
      case 'isinf':     return `isInfinite(${this.mapToString(args).join(', ')})`;
      case 'isfinite':  return `isFinite(${this.mapToString(args).join(', ')})`;
      case 'log':       return `log10(${this.mapToString(args).join(', ')})`;

      default: return super.visitFunction(node);
    }
  }

  protected visitQuery(node: Query, body: string[]): string {
    if (node._limitPerc) {
      throw new Error('LIMIT PERCENT is not supported.');
    }
    return super.visitQuery(node, body);
  }

  visitSetOperation(node: SetOperation): string {
    const upper = node.op.toUpperCase();
    if (upper.includes('BY NAME')) {
      throw new Error(`${upper} is not supported.`);
    }
    if (upper === 'UNION') {
      return super.visitSetOperation({...node, op: 'UNION DISTINCT'} as SetOperation);
    }
    return super.visitSetOperation(node);
  }

  visitSelectQuery(node: SelectQuery): string {
    // CH rejects a SELECT when an alias shares a name with a source column
    // referenced bare in GROUP BY / ORDER BY / HAVING. Rename each aliased
    // projection to a fresh placeholder so no inner alias collides with a
    // source column, then rename back in an outer SELECT so callers still
    // see the original names.
    if (!hasAliasCollision(node)) return super.visitSelectQuery(node);

    const inner = node.clone();
    inner._select = [];
    const projections: string[] = [];
    for (let i = 0; i < node._select.length; i++) {
      const { expr, alias } = node._select[i];
      const placeholder = `__clickhouse_alias_${i}`;
      inner._select.push(new SelectClauseNode(expr, placeholder));
      projections.push(
        `${quoteIdentifier(placeholder)} AS ${quoteIdentifier(alias)}`
      );
    }
    return `SELECT ${projections.join(', ')} FROM (${super.visitSelectQuery(inner)})`;
  }

  visitJoinClause(node: JoinNode): string {
    if (node.joinVariant === 'POSITIONAL') {
      throw new Error('Positional joins are not supported.');
    }
    if (node.joinVariant === 'ASOF' && !['INNER', 'LEFT'].includes(node.joinType)) {
      throw new Error(`ASOF ${node.joinType} joins are not supported.`);
    }
    return super.visitJoinClause(node);
  }

  visitWindowFrame(node: WindowFrameNode): string {
    if (node.frameType === 'GROUPS') {
      throw new Error('GROUPS window frames are not supported.');
    }
    if (node.exclude) {
      throw new Error('Window frame EXCLUDE is not supported.');
    }
    return super.visitWindowFrame(node);
  }

  visitWindowFunction(node: WindowFunctionNode): string {
    const { name, args, ignoreNulls, order } = node;
    if (order.length) {
      throw new Error('Window function argument ordering is not supported.');
    }
    const values = this.mapToString(args);
    const key = name.toLowerCase();
    const nullDefault = args.length < 3
      || (args[2]?.type === LITERAL && (args[2] as LiteralNode).value == null);
    if (key === 'nth_value' || (['lag', 'lead'].includes(key) && nullDefault)) {
      values[0] = `toNullable(${values[0]})`;
    }
    return `${name}(${values.join(', ')})${ignoreNulls ? ' IGNORE NULLS' : ''}`;
  }

  jsType(type: string): JSType {
    switch (type) {
      case 'UInt8':
      case 'UInt16':
      case 'UInt32':
      case 'UInt64':
      case 'UInt128':
      case 'UInt256':
      case 'Int8':
      case 'Int16':
      case 'Int32':
      case 'Int64':
      case 'Int128':
      case 'Int256':
      case 'Float32':
      case 'Float64':
        return 'number';
      case 'Date':
      case 'Date32':
      case 'DateTime':
        return 'date';
      case 'Bool':
        return 'boolean';
      case 'String':
      case 'UUID':
      case 'IPv4':
      case 'IPv6':
      case 'JSON':
        return 'string';
      case 'Point':
      case 'Ring':
      case 'Polygon':
      case 'MultiPolygon':
        return 'object';
      default:
        if (type.startsWith('Nullable(') || type.startsWith('LowCardinality(')) {
          return this.jsType(type.slice(type.indexOf('(') + 1, -1));
        }
        if (type.startsWith('Decimal')) return 'number';
        if (type.startsWith('DateTime')) return 'date';
        if (type.startsWith('FixedString')) return 'string';
        if (type.startsWith('Enum')) return 'string';
        if (type.startsWith('Array(')) return 'array';
        if (type.startsWith('Tuple(') || type.startsWith('Map(')) return 'object';
        throw new Error(`Unsupported type: ${type}`);
    }
  }

  normalizeDescribeResult(rows: unknown[]): ColumnDescription[] {
    return (rows as { name: string; type: string }[]).map(row => ({
      column_name: row.name,
      column_type: row.type,
      null: row.type.startsWith('Nullable(') ? 'YES' : 'NO'
    }));
  }
}

function hasAliasCollision(node: SelectQuery): boolean {
  const aliases = new Set(node._select.map(sel => sel.alias).filter(Boolean));
  if (aliases.size === 0) return false;
  let foundCollision = false;
  const clauses = [...node._groupby, ...node._orderby, ...node._having];
  for (const clause of clauses) {
    walk(clause, n => {
      if (isColumnRef(n) && !n.table && aliases.has(n.column)) {
        foundCollision = true;
        return -1;
      }
    });
    if (foundCollision) break;
  }
  return foundCollision;
}

export const clickHouseCodeGenerator = new ClickHouseCodeGenerator();
