import type { AggregateNode, ExprNode, Query, SelectQuery } from '@uwdata/mosaic-sql';
import type { MosaicClient } from '../MosaicClient.js';
import { collectAggregates, isAggregateExpression, isSelectQuery, isTableRef, rewrite, sql } from '@uwdata/mosaic-sql';
import { sufficientStatistics } from './sufficient-statistics.js';

interface PreAggColumnsResult {
  group: string[];
  preagg: Record<string, ExprNode>;
  output: Record<string, ExprNode>;
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
    const ref = q._from[0]?.expr;
    return isTableRef(ref) ? ref.name : ref;
  });
  if (typeof from !== 'string') return null;

  const aggrs = new Map<AggregateNode, ExprNode>();
  const preagg: Record<string, ExprNode> = {};
  const output: Record<string, ExprNode> = {};
  const group: string[] = []; // list of grouping dimension columns

  // generate a scalar subquery for a global average
  const avg = (ref: any) => {
    const name = ref.column;
    const expr = getBase(q, q => q._select.find(c => c.alias === name)?.expr);
    return sql`(SELECT avg(${expr ?? ref}) FROM "${from}")`;
  };

  // iterate over select clauses and analyze expressions
  for (const { alias, expr } of q._select) {
    // bail if there is an aggregate we can't analyze
    // a value > 1 indicates an aggregate in verbatim text
    if (isAggregateExpression(expr!) > 1) return null;

    const nodes = collectAggregates(expr!);
    if (nodes.length === 0) {
      // if no aggregates, expr is a groupby dimension
      group.push(alias);
      preagg[alias] = expr!;
    } else {
      for (const node of nodes) {
        // bail if distinct aggregate
        if (node.isDistinct) return null;

        // bail if aggregate function is unsupported
        // otherwise add output aggregate to rewrite map
        const agg = sufficientStatistics(node, preagg, avg);
        if (!agg) return null;
        aggrs.set(node, agg);
      }

      // rewrite original select clause to use preaggregates
      output[alias] = rewrite(expr!, aggrs)!;
    }
  }

  // bail if the query has no aggregates
  if (!aggrs.size) return null;

  return { group, preagg, output };
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
function getBase(query: Query, get: (q: SelectQuery) => any): string | undefined | number {
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