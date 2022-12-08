// sqrt((1 - r2) * regr_syy(${y}, ${x}) / n) AS se,
export function linearRegression(input, x, y, groupby) {
  return `SELECT
  REGR_INTERCEPT(${y}, ${x}) AS intercept,
  REGR_SLOPE(${y}, ${x}) AS slope,
  REGR_COUNT(${y}, ${x}) AS n,
  REGR_R2(${y}, ${x}) AS r2,
  REGR_SYY(${y}, ${x}) AS ssy,
  REGR_SXX(${y}, ${x}) AS ssx,
  REGR_AVGX(${y}, ${x}) AS xm,
  MIN(${x}) FILTER (${y} IS NOT NULL) AS x0,
  MAX(${x}) FILTER (${y} IS NOT NULL) AS x1
FROM ${input}` + (groupby ? `
GROUP BY ${groupby}` : '');
}

/*
https://github.com/observablehq/plot/blob/main/src/marks/linearRegression.js
https://github.com/observablehq/plot/blob/main/src/stats.js
const t = qt(p, I.length - 2);
return (x, k) => {
  const Y = f(x); // m * x + b
  const s = se * Math.sqrt(1 / n + (x - ux) ** 2 / ssx);
  return Y + k * t * s;
};
*/
