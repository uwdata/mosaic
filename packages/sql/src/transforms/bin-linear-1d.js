import { Query } from '../ast/query.js';
import { sum } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, mul, neq, sub } from '../functions/operators.js';

/**
 * Perform linear binning in one dimension.
 * @param {import('../ast/query.js').SelectQuery} query The base query to bin.
 * @param {import('../types.js').ExprValue} x The expression to bin.
 * @param {import('../types.js').ExprValue} [weight] The expression to weight by.
 * @param {string[]} [groupby] Group by expressions.
 * @returns {Query}
 */
export function binLinear1d(query, x, weight = undefined, groupby = []) {
  const w = weight ? (x => mul(x, weight)) : (x => x);
  const p0 = floor(x);
  const p1 = add(p0, 1);
  return Query
    .from(Query.unionAll(
      query.clone().select({ i: int32(p0), w: w(sub(p1, x)) }),
      query.clone().select({ i: int32(p1), w: w(sub(x, p0)) })
    ))
    .select({ index: 'i', density: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(neq('density', 0));
}
