import { expect, describe, it } from 'vitest';
import { areaPoints } from '../src/marks/RegressionMark.js';

// Compute fit columns as RegressionMark.query does with DuckDB's regr_*
// aggregates, where ssy (regr_syy) is the total sum of squares.
function fitColumns(x, y) {
  const n = x.length;
  const xm = x.reduce((a, b) => a + b) / n;
  const ym = y.reduce((a, b) => a + b) / n;
  const ssx = x.reduce((s, v) => s + (v - xm) ** 2, 0);
  const ssy = y.reduce((s, v) => s + (v - ym) ** 2, 0);
  const sxy = x.reduce((s, v, i) => s + (v - xm) * (y[i] - ym), 0);
  const slope = sxy / ssx;
  const intercept = ym - slope * xm;
  return {
    intercept: [intercept], slope: [slope], n: [n], ssy: [ssy], ssx: [ssx],
    xm: [xm], x0: [Math.min(...x)], x1: [Math.max(...x)]
  };
}

function band(columns, ci = 0.95) {
  return areaPoints({ numRows: 1, columns }, ci, 4, 400).columns;
}

describe('RegressionMark', () => {
  it('draws no confidence band around a perfect fit', () => {
    const { y1, y2 } = band(fitColumns([1, 2, 3], [2, 4, 6]));
    y1.forEach((y, i) => expect(y).toBeCloseTo(y2[i], 10));
  });

  it('bases the confidence band on the residual standard error', () => {
    const x = [1, 2, 3, 4, 5, 6];
    const y = [1, 3, 2, 5, 4, 6.5];
    const columns = fitColumns(x, y);
    const [intercept] = columns.intercept;
    const [slope] = columns.slope;
    const [ssx] = columns.ssx;
    const [xm] = columns.xm;
    const sse = x.reduce((s, v, i) => s + (y[i] - intercept - slope * v) ** 2, 0);
    const se = Math.sqrt(sse / (x.length - 2));
    const t = 2.7764451051977987; // 97.5th percentile, 4 degrees of freedom
    const { x: bx, y1, y2 } = band(columns);
    bx.forEach((v, i) => {
      const halfWidth = t * se * Math.sqrt(1 / x.length + (v - xm) ** 2 / ssx);
      expect(Math.abs(y2[i] - y1[i]) / 2).toBeCloseTo(halfWidth, 6);
    });
  });
});
