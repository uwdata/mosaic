import { Query, isQuery } from '../ast/query.js';
import { argmax, argmin, max, min } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';

/**
 * M4 is an optimization for value-preserving time-series aggregation
 * (https://www.vldb.org/pvldb/vol7/p797-jugel.pdf). This implementation uses
 * an efficient version with a single scan and the aggregate functions
 * argmin and argmax, following https://arxiv.org/pdf/2306.03714.pdf.
 * This method can bin along either the *x* or *y* dimension, as determined
 * by the caller-provided *bin* expression.
 * @param {import('../types.js').FromExpr} input The base query or table.
 * @param {import('../types.js').ExprValue} bin An expression that maps
 *  time-series values to fractional pixel positions.
 * @param {string} x The x dimension column name.
 * @param {string} y The y dimension column name.
 * @param {import('../ast/node.js').ExprNode[]} [groups] Additional
 *  groupby columns, for example for faceted charts.
 * @returns {Query} The resulting M4 query.
 */
export function m4(input, bin, x, y, groups = []) {
  const pixel = int32(floor(bin));

  const useCTE = isQuery(input);
  const inputExpr = useCTE ? 'input' : input;
  const query = useCTE ? Query.with({ input }) : Query;

  // DuckDB automatically materializes the input query based on heuristics.
  // Explicit use of MATERIALIZED is not required when:
  // 1. CTE performs a grouped aggregation
  // 2. CTE is queried more than once (here 4x)
  const q = (sel) => Query
    .from(inputExpr)
    .select(sel)
    .groupby(pixel, groups);

  return query
    .union(
      q([{ [x]: min(x), [y]: argmin(y, x) }, ...groups]),
      q([{ [x]: max(x), [y]: argmax(y, x) }, ...groups]),
      q([{ [x]: argmin(x, y), [y]: min(y) }, ...groups]),
      q([{ [x]: argmax(x, y), [y]: max(y) }, ...groups])
    )
    .orderby(groups, x);
}
