import {
  SQLNode,
  ExprNode,
  BetweenOpNode,
  NotBetweenOpNode,
  BinaryOpNode,
  CaseNode,
  WhenNode,
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
  Query,
  DescribeQuery,
  SelectQuery,
  SetOperation,
  SelectClauseNode,
  ScalarSubqueryNode,
  TableRefNode,
  TupleNode,
  UnaryOpNode,
  UnaryPostfixOpNode,
  ValuesNode,
  VerbatimNode,
  WindowNode,
  WindowClauseNode,
  WindowDefNode,
  WindowFrameExprNode,
  WindowFrameNode,
  WithClauseNode,
  isNode,
  isQuery,
  isTableRef
} from '../../ast/index.js';
import { SQLCodeGenerator } from './sql.js';
import { CURRENT_ROW, FOLLOWING, PRECEDING, UNBOUNDED } from '../../ast/window-frame.js';
import { WINDOW_EXTENT_EXPR } from '../../constants.js';
import { quoteIdentifier } from '../../util/string.js';

/**
 * Base class providing reusable SQL rendering defaults for dialect-specific
 * code generators (duckdb, clickhouse).
 */
export abstract class SQLDialectCodeGenerator extends SQLCodeGenerator {
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
        ? `(${columnNames.map(quoteIdentifier).join(', ')})`
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

  visitList(node: ListNode): string {
    const { values } = node;
    return `[${this.mapToString(values).join(', ')}]`;
  }

  visitLiteral(node: LiteralNode): string {
    const { value } = node;
    return this.literalToSQL(value);
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
    return this.literalToSQL(param.value);
  }

  protected visitQuery(node: Query, body: string[]): string {
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
      _select, _distinct, _from, _sample, _where,
      _groupby, _having, _window, _qualify
    } = node;

    const sql: string[] = [];

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

    return this.visitQuery(node, sql);
  }

  visitSetOperation(node: SetOperation): string {
    const { op, queries } = node;
    return this.visitQuery(node, [this.mapToString(queries).join(` ${op} `)]);
  }

  visitTableRef(node: TableRefNode): string {
    const { table } = node;
    return table.map(quoteIdentifier).join('.');
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
    return `${frameType} BETWEEN ${a} AND ${b}${exclude ? ` ${exclude}` : ''}`;
  }

  visitWithClause(node: WithClauseNode): string {
    const { name, query, materialized, columnNames } = node;
    const aliases = columnNames?.length
      ? `(${columnNames.map(quoteIdentifier).join(', ')})`
      : '';
    const mat = materialized === true ? 'MATERIALIZED '
      : materialized === false ? 'NOT MATERIALIZED '
      : '';
    return `${quoteIdentifier(name)}${aliases} AS ${mat}(${this.toString(query)})`;
  }

  literalToSQL(value: unknown): string {
    switch (typeof value) {
      case 'number':
        return Number.isFinite(value) ? `${value}` : 'NULL';
      case 'string':
        return `'${value.replaceAll(`'`, `''`)}'`;
      case 'boolean':
        return value ? 'TRUE' : 'FALSE';
      default:
        if (value == null) {
          return 'NULL';
        } else if (value instanceof Date) {
          const ts = +value;
          if (Number.isNaN(ts)) return 'NULL';
          const y = value.getUTCFullYear();
          const m = value.getUTCMonth();
          const d = value.getUTCDate();
          return ts === Date.UTC(y, m, d)
            ? `DATE '${y}-${m+1}-${d}'`
            : this.dateTimeToSQL(ts);
        } else if (value instanceof RegExp) {
          return `'${value.source}'`;
        } else {
          return `${value}`;
        }
    }
  }

  protected abstract dateTimeToSQL(timestamp: number): string;
}

function isColumnRefFor(expr: unknown, name: string): expr is ColumnRefNode {
  return expr instanceof ColumnRefNode
    && expr.table == null
    && expr.column === name;
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
