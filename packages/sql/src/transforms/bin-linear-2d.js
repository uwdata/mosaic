import { Query, SelectQuery } from '../ast/query.js';
import { sum } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, mul, neq, sub } from '../functions/operators.js';

/**
 * Identity function.
 * @template T
 * @param {T} x
 * @returns {T}
 */
function identity(x) {
  return x;
}

/**
 * Compute densities over a 2D domain using linear binning. The weight of
 * each data point is linearly distributed over adjacent bins, providing
 * a better base for subsequent kernel density estimation. This method takes
 * expressions for the (non-truncated) x and y bin values; these expressions
 * should be in units of grid indices, but can contain fractional components.
 * @param {SelectQuery} q The input query. The FROM and WHERE clauses should
 *  be added to the query separately, before this method is invoked.
 * @param {import('../types.js').ExprValue} xp The x grid bin expression
 * @param {import('../types.js').ExprValue} yp The y grid bin expression
 * @param {import('../types.js').ExprValue | undefined} weight Point weights.
 * @param {number} xn The number of x grid bins.
 * @param {string[]} [groupby] Group by expressions.
 * @returns {SelectQuery} A linear binning query for bin `index` and
 *  aggregate `density` columns, in addition to any group by expressions.
 */
export function binLinear2d(q, xp, yp, weight, xn, groupby = []) {

  const w = weight ? x => mul(x, weight) : identity;

  /**
   * @param {import('../types.js').ExprValue} i
   * @param {import('../types.js').ExprValue} w
   */
  const subq = (i, w) => q.clone().select({ xp, yp, i, w });
  /**
   * @param {import('../types.js').ExprValue} x
   * @param {import('../types.js').ExprValue} y
   */
  const index = (x, y) => add(x, mul(y, xn));

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
