import type { ExprNode } from '../ast/node.js';
import type { SelectQuery } from '../ast/query.js';
import type { ExprValue } from '../types.js';
import { Query } from '../ast/query.js';
import { sum } from '../functions/aggregate.js';
import { int32 } from '../functions/cast.js';
import { floor } from '../functions/numeric.js';
import { add, mul, neq, sub } from '../functions/operators.js';

/**
 * Perform linear binning in one dimension.
 * @param  query The base query to bin.
 * @param x The expression to bin.
 * @param weight The expression to weight by.
 * @param groupby Group by expressions.
 */
export function binLinear1d(
  query: SelectQuery,
  x: ExprValue,
  weight: ExprValue | undefined = undefined,
  groupby: string[] = []
) {
  const w = weight
    ? ((x: ExprNode) => mul(x, weight))
    : ((x: ExprNode) => x);
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
