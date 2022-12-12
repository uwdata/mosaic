import { bin } from './bin.js';
import { list } from './list.js';

export function m4(input, x, y, xb, lb, ub, width) {
  const xl = list(
    `MIN(${x})`,
    `MAX(${x})`,
    `ARG_MIN(${x}, ${y})`,
    `ARG_MAX(${x}, ${y})`
  );
  const yl = list(
    `ARG_MIN(${y}, ${x})`,
    `ARG_MAX(${y}, ${x})`,
    `MIN(${y})`,
    `MAX(${y})`
  );
  return `SELECT DISTINCT
  UNNEST(${xl}) AS ${x},
  UNNEST(${yl}) AS ${y}
FROM ${input}
GROUP BY (${bin(xb, lb, ub, width)})
ORDER BY ${x};`
}
