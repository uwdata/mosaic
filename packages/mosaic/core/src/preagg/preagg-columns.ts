import { asNode, collectAggregates, FromClauseNode, isAggregateExpression, isColumnRef, isSelectQuery, isTableRef, rewrite, sql } from '@uwdata/mosaic-sql';
import type { AggregateNode, ColumnRefNode, ExprNode, Query, SelectQuery } from '@uwdata/mosaic-sql';
import type { MosaicClient } from '../MosaicClient.js';
import { resolvePositional } from '../util/positional.js';
import { sufficientStatistics } from './sufficient-statistics.js';

// result of determining columns for preaggregation optimization
export interface PreAggColumnsResult {
  // Columns to include in a created preaggregate table
  preagg: Record<string, ExprNode>;
  // Output columns for selection update queries
  output: Record<string, ExprNode>;
  // Group by dimension aliases
  groupby: string[]
  // ORDER BY clause expressions, potentially rewritten for preaggregation
  orderby: ExprNode[];
  // HAVING clause expressions, potentially rewritten for preaggregation
  having: ExprNode[];
  // QUALIFY clause expressions, potentially rewritten for preaggregation
  qualify: ExprNode[];
}

/**
 * Determine pre-aggregation columns for a given Mosaic client.
 * @param client The Mosaic client.
 * @returns An object with necessary column data to generate pre-aggregated
 *  columns, or null if the client can't be optimized or the client query
 *  contains an invalid or unsupported expression.
 */
export function preaggColumns(client: MosaicClient): PreAggColumnsResult | null {
  if (!client.filterStable) return null;
  const q = client.query();

  // bail if query is not analyzable
  if (!isSelectQuery(q)) return null;

  // bail if no base table
  const from = getBase(q, q => {
    const node = q._from[0];
    const ref = node instanceof FromClauseNode && node.expr;
    return isTableRef(ref) ? ref.name : ref;
  });
  if (typeof from !== 'string') return null;

  // generate a scalar subquery for a global average
  // this may be used to mean-center data in preaggregate calculations
  const avg = (ref: ColumnRefNode) => {
    const name = ref.column;
    const expr = getBase(q, q => q._select.find(c => c.alias === name)?.expr);
    return sql`(SELECT avg(${expr ?? ref}) FROM "${from}")`;
  };

  const aggrs = new Map<AggregateNode, ExprNode>();
  const preagg: Record<string, ExprNode> = {}; // alias -> expr
  const output: Record<string, ExprNode> = {}; // alias -> expr
  const groupby: Record<string, string> = {}; // lower case alias -> alias

  try {
    const select = q._select;

    // iterate over select clauses and analyze expressions
    for (const { alias, expr } of select) {
      const result = analyzeExpression(expr, aggrs, preagg, avg);
      if (result) {
        // rewrite original select clause to use preaggregates
        output[alias] = result;
      } else {
        // include non-aggregates in preagg table and update results
        preagg[alias] = expr;
        output[alias] = asNode(alias);
        groupby[alias.toLowerCase()] = alias;
      }
    }

    // analyze any orderby expressions
    const orderby = q._orderby
      .map(expr => analyzeExpression(expr, aggrs, preagg, avg) ?? expr);

    // analyze any having expressions
    const having = q._having
      .map(expr => analyzeExpression(expr, aggrs, preagg, avg) ?? expr);

    // analyze any qualify expressions
    const qualify = q._qualify
      .map(expr => analyzeExpression(expr, aggrs, preagg, avg) ?? expr);

    // bail if query has no aggregates
    if (!aggrs.size) return null;

    // add groupby entries; these may or may not be selected
    let id = 0;
    for (let expr of q._groupby) {
      expr = resolvePositional(expr, select)?.expr ?? expr;
      const alias = isColumnRef(expr) ? expr.column : `__groupby_${++id}`;
      const key = alias.toLowerCase();
      if (!groupby[key]) {
        // add non-selected groupby term
        preagg[alias] = expr;
        groupby[key] = alias;
      }
    }

    return {
      groupby: Object.values(groupby),
      orderby,
      preagg,
      output,
      having,
      qualify
    };
  } catch {
    // bail if unsupported aggregate was encountered
    return null;
  }
}

/**
 * Analyzes an expression and returns a rewritten expression if preaggregation
 * optimization is supported. Returns undefined if the expression does not
 * contain any aggregates. Throws if the expression contains an unsupported
 * or non-optimizable aggregate.
 */
function analyzeExpression(
  expr: ExprNode,
  aggrs: Map<AggregateNode, ExprNode>,
  preagg: Record<string, ExprNode>,
  avg: (ref: ColumnRefNode) => ExprNode
) {
  // bail if there is an aggregate we can't analyze
  // a value > 1 indicates an aggregate in verbatim text
  if (isAggregateExpression(expr!) > 1) throw new Error();

  const nodes = collectAggregates(expr!);
  if (nodes.length) {
    for (const node of nodes) {
      // bail if distinct aggregate
      if (node.isDistinct) throw new Error();

      // bail if aggregate function is unsupported
      // otherwise add output aggregate to rewrite map
      const agg = sufficientStatistics(node, preagg, avg);
      if (!agg) throw new Error();
      aggrs.set(node, agg);
    }

    // rewrite original expression to use preaggregates
    return rewrite(expr!, aggrs)!;
  }
}

/**
 * Identify a shared base (source) query and extract a value from it.
 * This method is used to find a shared base table name or extract
 * the original column name within a base table.
 * @param query The input query.
 * @param get A getter function to extract
 *  a value from a base query.
 * @returns the base query value, or
 *  `undefined` if there is no source table, or `NaN` if the
 *  query operates over multiple source tables.
 */
function getBase<T>(
  query: Query,
  get: (q: SelectQuery) => T
): T | number | undefined {
  const subq = query.subqueries;

  // select query
  if (isSelectQuery(query) && subq.length === 0) {
    return get(query);
  }

  // handle set operations / subqueries
  const base = getBase(subq[0], get);
  for (let i = 1; i < subq.length; ++i) {
    const value = getBase(subq[i], get);
    if (value === undefined) continue;
    if (value !== base) return NaN;
  }
  return base;
}
