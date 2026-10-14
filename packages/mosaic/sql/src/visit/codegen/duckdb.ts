import {
  SQLNode,
  ExprNode,
  AggregateNode,
  BetweenOpNode,
  NotBetweenOpNode,
  BinaryOpNode,
  CaseNode,
  WhenNode,
  CastNode,
  CollateNode,
  ColumnParamNode,
  ColumnRefNode,
  ColumnsNode,
  CreateQuery,
  CreateSchemaQuery,
  FragmentNode,
  FromClauseNode,
  FunctionNode,
  InOpNode,
  IntervalNode,
  JoinNode,
  LambdaNode,
  LambdaVarNode,
  ListNode,
  LiteralNode,
  LogicalOpNode,
  NamedArgNode,
  OrderByNode,
  ParamNode,
  PivotQuery,
  QuantifiedOpNode,
  Query,
  DescribeQuery,
  SelectQuery,
  SetOperation,
  SampleClauseNode,
  SelectClauseNode,
  ScalarSubqueryNode,
  SliceNode,
  StarNode,
  SubscriptNode,
  TableRefNode,
  TupleNode,
  UnaryOpNode,
  UnaryPostfixOpNode,
  UnnestNode,
  ValuesNode,
  VerbatimNode,
  WindowNode,
  WindowClauseNode,
  WindowDefNode,
  WindowFunctionNode,
  WindowFrameNode,
  WindowFrameExprNode,
  WithClauseNode,
  isNode,
  isQuery,
  isTableRef
} from '../../ast/index.js';
import { quoteIdentifier } from '../../util/string.js';
import { literalToSQL } from '../../ast/literal.js';
import { SQLCodeGenerator } from './sql.js';
import { CURRENT_ROW, FOLLOWING, PRECEDING, UNBOUNDED } from '../../ast/window-frame.js';
import { COLUMN_PARAM, COLUMN_REF, FUNCTION, LIST, SET_OPERATION, SLICE, SUBSCRIPT, WINDOW_EXTENT_EXPR } from '../../constants.js';

/**
 * DuckDB SQL dialect visitor for converting AST nodes to DuckDB-compatible SQL.
 */
export class DuckDBCodeGenerator extends SQLCodeGenerator {
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

  visitAll(): string {
    return 'ALL';
  }

  visitBetween(node: BetweenOpNode): string {
    return betweenToString(this, node, 'BETWEEN');
  }

  visitBinary(node: BinaryOpNode): string {
    const { left, right, op } = node;
    return `(${this.toString(left)} ${op} ${this.toString(right)})`;
  }

  visitCase(node: CaseNode): string {
    const { expr, _when, _else } = node;
    return 'CASE '
      + (expr ? `${this.toString(expr)} ` : '')
      + this.mapToString(_when).join(' ')
      + (_else ? ` ELSE ${this.toString(_else)}` : '')
      + ' END';
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

  visitColumnParam(node: ColumnParamNode): string {
    return this.visitColumnRef(node);
  }

  visitColumnRef(node: ColumnRefNode): string {
    const { column, table } = node;
    const tref = table ? `${this.toString(table)}.` : '';
    const id = column === '*' ? '*' : quoteIdentifier(column);
    return `${tref}${id}${node instanceof StarNode ? starModifiers(this, node) : ''}`;
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

  visitDescribeQuery(node: DescribeQuery): string {
    const { query } = node;
    return `DESC ${this.toString(query)}`;
  }

  visitExpression(node: ExprNode): string {
    // This method might not be used in practice, but needs to exist for the interface
    // If we reach here, it might be an error or a generic fallback
    throw new Error(`Unexpected EXPRESSION node type. Node: ${JSON.stringify(node)}`);
  }

  visitFragment(node: FragmentNode): string {
    const { spans } = node;
    return spans.map((span: string | SQLNode) => {
      return typeof span === 'string' ? span : this.toString(span);
    }).join('');
  }

  visitFromClause(node: FromClauseNode): string {
    const { expr, alias, columnNames, sample } = node;
    const ref = isQuery(expr) ? `(${this.toString(expr)})` : `${this.toString(expr)}`;

    let from: string;
    if (alias && (columnNames?.length || !(isTableRef(expr) && expr.name === alias))) {
      const names = columnNames?.length
        ? `(${columnNames.map(v => quoteIdentifier(v)).join(', ')})`
        : '';
      from = `${ref} AS ${quoteIdentifier(alias)}${names}`;
    } else {
      from = `${ref}`;
    }

    return `${from}${sample ? ` TABLESAMPLE ${this.toString(sample)}` : ''}`;
  }

  visitFunction(node: FunctionNode): string {
    const { name, args } = node;
    return `${name}(${this.mapToString(args).join(', ')})`;
  }

  visitIn(node: InOpNode): string {
    const { expr, values } = node;
    return `(${this.toString(expr)} IN ${this.toString(values)})`;
  }

  visitInterval(node: IntervalNode): string {
    const { steps, name } = node;
    return `INTERVAL ${steps} ${name}`;
  }

  visitJoinClause(node: JoinNode): string {
    const { left, right, joinVariant, joinType, condition, using, sample } = node;
    const variant = joinVariant === 'REGULAR' ? '' : `${joinVariant} `;
    let type = '';
    let cond = '';

    if (joinVariant !== 'CROSS') {
      type = joinType !== 'INNER' ? `${joinType} ` : '';
      cond = condition ? ` ON ${this.toString(condition)}`
        : using ? ` USING (${this.mapToString(using).join(', ')})`
        : '';
    }
    const samp = sample ? ` USING SAMPLE ${this.toString(sample)}` : '';
    return `${this.toString(left)} ${variant}${type}JOIN ${this.toString(right)}${cond}${samp}`;
  }

  visitLambda(node: LambdaNode): string {
    const { params, body } = node;
    return `lambda ${params.map(p => quoteIdentifier(p)).join(', ')}: ${this.toString(body)}`;
  }

  visitLambdaVar(node: LambdaVarNode): string {
    return quoteIdentifier(node.name);
  }

  visitList(node: ListNode): string {
    const { values } = node;
    return `[${this.mapToString(values).join(', ')}]`;
  }

  visitLiteral(node: LiteralNode): string {
    const { value } = node;
    return literalToSQL(value);
  }

  visitLogicalOperator(node: LogicalOpNode<ExprNode>): string {
    const { clauses, op } = node;
    const c = this.mapToString(clauses);
    return c.length === 0 ? ''
      : c.length === 1 ? `${c[0]}`
      : `(${c.join(` ${op} `)})`;
  }

  visitNotBetween(node: NotBetweenOpNode): string {
    return betweenToString(this, node, 'NOT BETWEEN');
  }

  visitNamedArg(node: NamedArgNode): string {
    const { name, expr } = node;
    return `${quoteIdentifier(name)} := ${this.toString(expr)}`;
  }

  visitOrderBy(node: OrderByNode): string {
    const { expr, desc, nullsFirst } = node;
    const dir = desc ? ' DESC'
      : desc === false ? ' ASC'
      : '';
    const nf = nullsFirst ? ' NULLS FIRST'
      : nullsFirst === false ? ' NULLS LAST'
      : '';
    return `${this.toString(expr)}${dir}${nf}`;
  }

  visitParam(node: ParamNode): string {
    const { param } = node;
    // Get the current value from the parameter and format it as a literal
    return literalToSQL(param.value);
  }

  private visitQuery(node: Query, body: string[]): string {
    const { _with, _orderby, _limitPerc, _limit, _offset } = node;

    const sql: string[] = [];

    // WITH
    if (_with.length) {
      sql.push(`WITH ${this.mapToString(_with).join(', ')}`);
    }

    // QUERY BODY
    sql.push(...body);

    // ORDER BY
    if (_orderby.length) {
      sql.push(`ORDER BY ${this.mapToString(_orderby).join(', ')}`);
    }

    // LIMIT
    if (_limit != null) {
      sql.push(`LIMIT ${this.toString(_limit)}${_limitPerc ? '%' : ''}`);
    }

    // OFFSET
    if (_offset != null) {
      sql.push(`OFFSET ${this.toString(_offset)}`);
    }

    return sql.join(' ');
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

  visitScalarSubquery(node: ScalarSubqueryNode): string {
    return `(${this.toString(node.subquery)})`;
  }

  visitSelectClause(node: SelectClauseNode): string {
    const { expr, alias } = node;
    const sql = this.toString(expr);

    // DuckDB applies an alias to every column a COLUMNS expression expands
    // to, so drop aliases that select() derived from the expression text
    return !alias || isColumnRefFor(expr, alias) || isStarRef(expr)
      || (alias === sql && isExpandingColumns(expr))
      ? sql
      : `${sql} AS ${quoteIdentifier(alias)}`;
  }

  visitSelectQuery(node: SelectQuery): string {
    const {
      _select, _distinct, _distinctOn, _from, _sample, _where,
      _groupby, _having, _window, _qualify
    } = node;

    const sql: string[] = [];

    // SELECT
    const distinct = _distinctOn.length
      ? ` DISTINCT ON (${this.mapToString(_distinctOn).join(', ')})`
      : _distinct ? ' DISTINCT' : '';
    sql.push(`SELECT${distinct} ${this.mapToString(_select).join(', ')}`);

    // FROM
    if (_from.length) {
      sql.push(`FROM ${this.mapToString(_from).join(', ')}`);
    }

    // SAMPLE
    if (_sample) {
      sql.push(`USING SAMPLE ${this.toString(_sample)}`);
    }

    // WHERE
    if (_where.length) {
      const clauses = this.mapToString(_where).filter(x => x).join(' AND ');
      if (clauses) sql.push(`WHERE ${clauses}`);
    }

    // GROUP BY
    if (_groupby.length) {
      sql.push(`GROUP BY ${this.mapToString(_groupby).join(', ')}`);
    }

    // HAVING
    if (_having.length) {
      const clauses = this.mapToString(_having).filter(x => x).join(' AND ');
      if (clauses) sql.push(`HAVING ${clauses}`);
    }

    // WINDOW
    if (_window.length) {
      sql.push(`WINDOW ${this.mapToString(_window).join(', ')}`);
    }

    // QUALIFY
    if (_qualify.length) {
      const clauses = this.mapToString(_qualify).filter(x => x).join(' AND ');
      if (clauses) sql.push(`QUALIFY ${clauses}`);
    }

    return this.visitQuery(node, sql);
  }

  visitSetOperation(node: SetOperation): string {
    const { op, queries } = node;
    const sql = queries.map(q => {
      const s = this.toString(q);
      return isCompoundQuery(q) ? `(${s})` : s;
    });
    return this.visitQuery(node, [sql.join(` ${op} `)]);
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

  visitTableRef(node: TableRefNode): string {
    const { table } = node;
    return table.map((t: string) => quoteIdentifier(t)).join('.');
  }

  visitTuple(node: TupleNode): string {
    const { values } = node;
    return `(${this.mapToString(values).join(', ')})`;
  }

  visitUnary(node: UnaryOpNode): string {
    const { expr, op } = node;
    return `(${op} ${this.toString(expr)})`;
  }

  visitUnaryPostfix(node: UnaryPostfixOpNode): string {
    const { expr, op } = node;
    return `(${this.toString(expr)} ${op})`;
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

  visitValues(node: ValuesNode): string {
    const { values } = node;
    return `VALUES ${this.mapToString(values).join(', ')}`;
  }

  visitVerbatim(node: VerbatimNode): string {
    const { value } = node;
    return value;
  }

  visitWhen(node: WhenNode): string {
    const { when, then } = node;
    return `WHEN ${this.toString(when)} THEN ${this.toString(then)}`;
  }

  visitWindow(node: WindowNode): string {
    const { func, def } = node;
    return `${this.toString(func)} OVER ${this.toString(def)}`;
  }

  visitWindowClause(node: WindowClauseNode): string {
    const { name, def } = node;
    return `${quoteIdentifier(name)} AS ${this.toString(def)}`;
  }

  visitWindowDef(node: WindowDefNode): string {
    const { name, partition, order, framedef } = node;
    const base = name && quoteIdentifier(name);
    const def = [
      base,
      partition?.length && `PARTITION BY ${this.mapToString(partition).join(', ')}`,
      order?.length && `ORDER BY ${this.mapToString(order).join(', ')}`,
      framedef && this.toString(framedef)
    ].filter(x => x);
    return base && def.length < 2 ? base : `(${def.join(' ')})`;
  }

  visitWindowExtentExpr(node: WindowFrameExprNode): string {
    const { scope, expr } = node;
    return scope === CURRENT_ROW
      ? scope
      : `${isNode(expr) ? this.toString(expr) : (expr ?? UNBOUNDED)} ${scope}`;
  }

  visitWindowFrame(node: WindowFrameNode): string {
    const { frameType, exclude, extent } = node;
    const [prev, next] = isNode(extent)
      ? extent.value as [unknown, unknown]
      : extent;
    const a = formatFrameExpr(this, prev, PRECEDING);
    const b = formatFrameExpr(this, next, FOLLOWING);
    return `${frameType} BETWEEN ${a} AND ${b}${exclude ? ` EXCLUDE ${exclude}` : ''}`;
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

  visitWithClause(node: WithClauseNode): string {
    const { name, query, materialized, columnNames } = node;
    const aliases = columnNames?.length
      ? `(${columnNames.map(v => quoteIdentifier(v)).join(', ')})`
      : '';
    const mat = materialized === true ? 'MATERIALIZED '
      : materialized === false ? 'NOT MATERIALIZED '
      : '';
    return `${quoteIdentifier(name)}${aliases} AS ${mat}(${this.toString(query)})`;
  }
}

function isColumnRefFor(expr: unknown, name: string): expr is ColumnRefNode {
  return expr instanceof ColumnRefNode
    && expr.table == null
    && expr.column === name;
}

function isStarRef(expr: unknown): boolean {
  return expr instanceof ColumnRefNode && expr.column === '*';
}

function isExpandingColumns(expr: ExprNode): boolean {
  return expr instanceof ColumnsNode && !expr.unpack;
}

function betweenToString(
  visitor: SQLCodeGenerator,
  node: BetweenOpNode | NotBetweenOpNode,
  op: string
) {
  const { extent, expr } = node;
  if (!extent) return '';
  const [a, b] = visitor.mapToString(extent);
  return `(${visitor.toString(expr)} ${op} ${a} AND ${b})`;
}

function formatFrameExpr(visitor: SQLCodeGenerator, value: unknown, scope: string) {
  const x = isNode(value) ? visitor.toString(value) : value;
  return isNode(value) && value.type === WINDOW_EXTENT_EXPR ? x
    : x != null && typeof x !== 'number' ? `${x} ${scope}`
    : x === 0 ? CURRENT_ROW
    : !(x && Number.isFinite(x)) ? `${UNBOUNDED} ${scope}`
    : `${Math.abs(x)} ${scope}`;
}

function starModifiers(visitor: SQLCodeGenerator, node: StarNode) {
  const { exclude, replace, rename } = node;
  const sql: string[] = [];
  if (exclude.length) {
    sql.push(`EXCLUDE (${exclude.map(v => quoteIdentifier(v)).join(', ')})`);
  }
  if (replace.length) {
    const list = replace.map(({ expr, alias }) => `${visitor.toString(expr)} AS ${quoteIdentifier(alias)}`);
    sql.push(`REPLACE (${list.join(', ')})`);
  }
  if (rename.length) {
    const list = rename.map(([from, to]) => `${quoteIdentifier(from)} AS ${quoteIdentifier(to)}`);
    sql.push(`RENAME (${list.join(', ')})`);
  }
  return sql.map(s => ` ${s}`).join('');
}

function isCompoundQuery(query: Query) {
  return query.type === SET_OPERATION
    || query._with.length > 0
    || query._orderby.length > 0
    || query._limit != null
    || query._offset != null;
}

const SUBSCRIPTABLE = new Set([COLUMN_PARAM, COLUMN_REF, FUNCTION, LIST, SLICE, SUBSCRIPT]);

function subscriptTarget(visitor: SQLCodeGenerator, expr: ExprNode) {
  const s = visitor.toString(expr);
  return SUBSCRIPTABLE.has(expr.type) ? s : `(${s})`;
}

// Create a default DuckDB visitor instance for convenience
export const duckDBCodeGenerator = new DuckDBCodeGenerator();
