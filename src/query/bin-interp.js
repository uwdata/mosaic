import { list } from './list.js';

export function binInterp(input, x, lo, hi, n, weight) {
  const p = `(${x} - ${lo}) * ${(n - 1) / (hi - lo)}`;
  const w = weight && weight !== 1 ? `* ${weight}` : '';

// return `WITH
//   bins AS (
//     SELECT
//       ${p} AS p,
//       UNNEST(${list('FLOOR(p)', 'FLOOR(p) + 1')}) AS i,
//       UNNEST(${list(`(FLOOR(p) + 1 - p)${w}`, `(p - FLOOR(p))${w}`)}) AS w
//     FROM ${input}
//     WHERE ${x} BETWEEN ${lo} AND ${hi}
//   )
// SELECT
//   i AS index,
//   SUM(w) AS weight
// FROM bins
// GROUP BY index
// HAVING weight > 0`;

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

// export function bin1d(data, x, weight, lo, hi, n) {
//   const grid = new Float64Array(n);
//   const delta = (n - 1) / (hi - lo);

//   for (let i = 0; i < data.length; ++i) {
//     const d = data[i];
//     const xi = x(d, i, data);
//     const wi = weight(d, i, data);

//     // skip NaN and Infinite values
//     if (!(Number.isFinite(xi) && Number.isFinite(wi))) {
//       continue;
//     }

//     const p = (xi - lo) * delta;
//     const u = Math.floor(p);
//     const v = u + 1;

//     if (0 <= u && v < n) {
//       grid[u] += (v - p) * wi;
//       grid[v] += (p - u) * wi;
//     } else if (u === -1) {
//       grid[v] += (p - u) * wi;
//     } else if (v === n) {
//       grid[u] += (v - p) * wi;
//     }
//   }

//   return grid;
// }
