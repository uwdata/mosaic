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
  FragmentNode,
  FromClauseNode,
  FunctionNode,
  InOpNode,
  IntervalNode,
  JoinNode,
  ListNode,
  LiteralNode,
  LogicalOpNode,
  OrderByNode,
  ParamNode,
  DescribeQuery,
  SelectQuery,
  SetOperation,
  SampleClauseNode,
  SelectClauseNode,
  ScalarSubqueryNode,
  TableRefNode,
  UnaryOpNode,
  UnaryPostfixOpNode,
  UnnestNode,
  VerbatimNode,
  WindowNode,
  WindowClauseNode,
  WindowDefNode,
  WindowFunctionNode,
  WindowFrameNode,
  WindowFrameExprNode,
  WithClauseNode,
  isNode
} from '../../index.js';
import { quoteIdentifier } from '../../util/string.js';
import { literalToSQL } from '../../ast/literal.js';
import { SQLCodeGenerator } from './sql.js';
import { CURRENT_ROW, FOLLOWING, PRECEDING, UNBOUNDED } from '../../ast/window-frame.js';
import { WINDOW_EXTENT_EXPR } from '../../constants.js';

function betweenToString(node: BetweenOpNode | NotBetweenOpNode, op: string) {
  const { extent: r, expr } = node;
  return r ? `(${expr} ${op} ${r[0]} AND ${r[1]})` : '';
}

function isColumnRefFor(expr: unknown, name: string): expr is ColumnRefNode {
  return expr instanceof ColumnRefNode
    && expr.table == null
    && expr.column === name;
}

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

  visitBetween(node: BetweenOpNode): string {
    return betweenToString(node, 'BETWEEN');
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
    const { expr, cast } = node;
    return `(${this.toString(expr)})::${cast}`;
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
    return `${tref}${id}`;
  }

  visitDescribeQuery(node: DescribeQuery): string {
    const { query } = node;
    return `DESCRIBE ${this.toString(query)}`;
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
    const { expr, alias, sample } = node;
    const isQuery = expr.type === 'SELECT_QUERY' || expr.type === 'SET_OPERATION';
    const isTableRef = expr.type === 'TABLE_REF';
    const ref = isQuery ? `(${this.toString(expr)})` : `${this.toString(expr)}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const from = alias && !(isTableRef && (expr as any).table?.join('.') === alias)
      ? `${ref} AS ${quoteIdentifier(alias)}`
      : `${ref}`;
    return `${from}${sample ? ` TABLESAMPLE ${this.toString(sample)}` : ''}`;
  }

  visitFunction(node: FunctionNode): string {
    const { name, args } = node;
    return `${name}(${this.mapToString(args).join(', ')})`;
  }

  visitIn(node: InOpNode): string {
    const { expr, values } = node;
    return `(${this.toString(expr)} IN (${this.mapToString(values).join(', ')}))`;
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
      cond = condition ? ` ON ${condition}`
        : using ? ` USING (${using?.join(', ')})`
        : '';
    }
    const samp = sample ? ` USING SAMPLE ${sample}` : '';
    return `${left} ${variant}${type}JOIN ${right}${cond}${samp}`;
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
    return betweenToString(node, 'NOT BETWEEN');
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

    return !alias || isColumnRefFor(expr, alias)
      ? this.toString(expr)
      : `${this.toString(expr)} AS ${quoteIdentifier(alias)}`;
  }

  visitSelectQuery(node: SelectQuery): string {
    const {
      _with, _select, _distinct, _from, _sample, _where,
      _groupby, _having, _window, _qualify, _orderby,
      _limitPerc, _limit, _offset
    } = node;

    const sql = [];

    // WITH
    if (_with.length) {
      sql.push(`WITH ${this.mapToString(_with).join(', ')}`);
    }

    // SELECT
    sql.push(`SELECT${_distinct ? ' DISTINCT' : ''} ${this.mapToString(_select).join(', ')}`);

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

    // ORDER BY
    if (_orderby.length) {
      sql.push(`ORDER BY ${this.mapToString(_orderby).join(', ')}`);
    }

    // LIMIT
    if (_limit) {
      sql.push(`LIMIT ${this.toString(_limit)}${_limitPerc ? '%' : ''}`);
    }

    // OFFSET
    if (_offset != null) {
      sql.push(`OFFSET ${this.toString(_offset)}`);
    }

    return sql.join(' ');
  }

  visitSetOperation(node: SetOperation): string {
    const { op, queries, _with, _orderby, _limitPerc, _limit, _offset } = node;
    const sql = [];

    // WITH
    if (_with.length) sql.push(`WITH ${_with.join(', ')}`);

    // SUBQUERIES
    sql.push(queries.join(` ${op} `));

    // ORDER BY
    if (_orderby.length) sql.push(`ORDER BY ${_orderby.join(', ')}`);

    // LIMIT
    if (_limit) sql.push(`LIMIT ${_limit}${_limitPerc ? '%' : ''}`);

    // OFFSET
    if (_offset) sql.push(`OFFSET ${_offset}`);

    return sql.join(' ');
  }

  visitTableRef(node: TableRefNode): string {
    const { table } = node;
    return table.map((t: string) => quoteIdentifier(t)).join('.');
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
    const a = this.formatFrameExpr(prev, PRECEDING);
    const b = this.formatFrameExpr(next, FOLLOWING);
    return `${frameType} BETWEEN ${a} AND ${b}${exclude ? ` ${exclude}` : ''}`;
  }

  private formatFrameExpr(value: unknown, scope: string) {
    const x = isNode(value) ? this.toString(value) : value;
    return isNode(value) && value.type === WINDOW_EXTENT_EXPR ? x
      : x != null && typeof x !== 'number' ? `${x} ${scope}`
      : x === 0 ? CURRENT_ROW
      : !(x && Number.isFinite(x)) ? `${UNBOUNDED} ${scope}`
      : `${Math.abs(x)} ${scope}`;
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
    const { name, query, materialized } = node;
    const mat = materialized === true ? 'MATERIALIZED '
      : materialized === false ? 'NOT MATERIALIZED '
      : '';
    return `${quoteIdentifier(name)} AS ${mat}(${this.toString(query)})`;
  }
}

// Create a default DuckDB visitor instance for convenience
export const duckDBCodeGenerator = new DuckDBCodeGenerator();
