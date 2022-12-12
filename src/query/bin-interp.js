import { list } from './list.js';

export function binInterp(input, x, lo, hi, n, weight) {
  const p = `(${x} - ${lo}) * ${(n - 1) / (hi - lo)}`;
  const w = weight && weight !== 1 ? `* ${weight}` : '';
  return `WITH
  bins AS (
    SELECT
      ${p} AS p,
      FLOOR(p) AS u,
      UNNEST(${list('u', 'u + 1')}) AS i,
      UNNEST(${list(`(u + 1 - p)${w}`, `(p - u)${w}`)}) AS w
    FROM ${input}
    WHERE ${x} BETWEEN ${lo} AND ${hi}
  )
SELECT
  i AS index,
  SUM(w) AS weight
FROM bins
GROUP BY index
HAVING weight > 0`;
}
