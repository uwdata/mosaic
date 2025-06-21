import type { ExprNode } from '../ast/node.js';
import type { SelectQuery } from '../ast/query.js';
import type { ExprValue } from '../types.js';
import { Query } from '../ast/query.js';
import { sum } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, mul, neq, sub } from '../functions/operators.js';
import { identity } from '../util/identity.js';

/**
 * Compute densities over a 2D domain using linear binning. The weight of
 * each data point is linearly distributed over adjacent bins, providing
 * a better base for subsequent kernel density estimation. This method takes
 * expressions for the (non-truncated) x and y bin values; these expressions
 * should be in units of grid indices, but can contain fractional components.
 * @param q The input query. The FROM and WHERE clauses should
 *  be added to the query separately, before this method is invoked.
 * @param xp The x grid bin expression
 * @param yp The y grid bin expression
 * @param weight Point weights.
 * @param xn The number of x grid bins.
 * @param groupby Group by expressions.
 * @returns A linear binning query for bin `index` and aggregate `density`
 *  columns, in addition to any group by expressions.
 */
export function binLinear2d(
  q: SelectQuery,
  xp: ExprValue,
  yp: ExprValue,
  weight: ExprValue | undefined,
  xn: number,
  groupby: string[] = []
) {
  const w = weight ? (x: ExprNode) => mul(x, weight) : identity;

  const subq = (i: ExprValue, w: ExprValue) => q.clone().select({ xp, yp, i, w });
  const index = (x: ExprValue, y: ExprValue) => add(x, mul(y, xn));

  const xu = int32(floor(xp));
  const yu = int32(floor(yp));
  const xv = add(xu, 1);
  const yv = add(yu, 1);
  const xpu = sub(xp, xu);
  const xvp = sub(xv, xp);
  const ypu = sub(yp, yu);
  const yvp = sub(yv, yp);

  return Query
    .from(Query.unionAll(
      // grid[xu + yu * xn] += (xv - xp) * (yv - yp) * wi
      subq(index(xu, yu), w(mul(xvp, yvp))),
      // grid[xu + yv * xn] += (xv - xp) * (yp - yu) * wi
      subq(index(xu, yv), w(mul(xvp, ypu))),
      // grid[xv + yu * xn] += (xp - xu) * (yv - yp) * wi
      subq(index(xv, yu), w(mul(xpu, yvp))),
      // grid[xv + yv * xn] += (xp - xu) * (yp - yu) * wi
      subq(index(xv, yv), w(mul(xpu, ypu)))
    ))
    .select({ index: 'i', density: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(neq('density', 0));
}
