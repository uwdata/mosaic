/**
 * @import { ExprNode } from '../ast/node.js'
 * @import { ExprValue, FromExpr } from '../types.js'
 */
import { Query, isQuery } from '../ast/query.js';
import { argmax, argmin, max, min } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { cte } from '../functions/cte.js';
import { floor } from '../functions/numeric.js';

/**
 * M4 is an optimization for value-preserving time-series aggregation
 * (https://www.vldb.org/pvldb/vol7/p797-jugel.pdf). This implementation uses
 * an efficient version with a single scan and the aggregate functions
 * argmin and argmax, following https://arxiv.org/pdf/2306.03714.pdf.
 * This method can bin along either the *x* or *y* dimension, as determined
 * by the caller-provided *bin* expression.
 * @param {FromExpr} input The base query or table.
 * @param {ExprValue} bin An expression that maps
 *  time-series values to fractional pixel positions.
 * @param {string} x The x dimension column name.
 * @param {string} y The y dimension column name.
 * @param {ExprNode[]} [groups] Additional
 *  groupby columns, for example for faceted charts.
 * @returns {Query} The resulting M4 query.
 */
export function m4(input, bin, x, y, groups = []) {
  const pixel = int32(floor(bin));

  // Below, we treat input as a CTE when it is a query. In this case,
  // we also request that the CTE be explicitly materialized.
  const useCTE = isQuery(input);
  const from = useCTE ? 'input' : input;
  const query = useCTE
    ? Query.with(cte(/** @type {string} */(from), input, true))
    : Query;

  const q = (sel) => Query
    .from(from)
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
