import type { SelectQuery } from '../ast/query.js';
import type { ExprValue } from '../types.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, mul } from '../functions/operators.js';

/**
 * Perform aggregation over a binned 2D domain. This method takes expressions
 * for the (non-truncated) x and y bin values; these expressions should be
 * in units of grid indices, but can contain fractional components. The
 * resulting query performs grouping and aggregation over the binned domain,
 * and uses a 2D integer bin index of the form (xbin + num_xbins * ybin).
 * @param q The input query. The FROM and WHERE clauses should
 *  be added to the query separately, either before or after this method.
 * @param xp The x bin expression.
 * @param yp The y bin expression.
 * @param aggs Named aggregate expressions over bins.
 * @param {xn The number of bins along the x dimension
 * @param groupby Group by expressions.
 * @returns The input query, with binning expressions added.
 */
export function bin2d(
  q: SelectQuery,
  xp: ExprValue,
  yp: ExprValue,
  aggs: Record<string, ExprValue>,
  xn: number,
  groupby: string[]
) {
  return q
    .select({
      index: add(int32(floor(xp)), mul(int32(floor(yp)), xn)),
      ...aggs
    })
    .groupby('index', groupby);
}
