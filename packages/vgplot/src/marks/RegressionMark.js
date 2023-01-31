import { range } from 'd3';
import {
  Query, max, min, isNotNull,
  regrIntercept, regrSlope, regrCount,
  regrR2, regrSYY, regrSXX, regrAvgX
} from '@mosaic/sql';
import { qt } from './util/stats.js';
import { Mark } from './Mark.js';

export class RegressionMark extends Mark {
  constructor(source, options) {
    const { ci = 0.95, precision = 4, ...channels } = options;
    super('line', source, channels);
    this.ci = ci;
    this.precision = precision;
  }

  query(filter = []) {
    const x = 'x';
    const y = 'y';
    const groupby = this.channelField('stroke') ? ['stroke'] : [];

    return Query
      .from(super.query(filter))
      .select({
        intercept: regrIntercept(y, x),
        slope: regrSlope(y, x),
        n: regrCount(y, x),
        r2: regrR2(y, x),
        ssy: regrSYY(y, x),
        ssx: regrSXX(y, x),
        xm: regrAvgX(y, x),
        x0: min(x).where(isNotNull(y)),
        x1: max(x).where(isNotNull(y))
      })
      .select(groupby)
      .groupby(groupby);
  }

  queryResult(data) {
    data = Array.from(data);

    // regression line
    this.lineData = data.flatMap(m => linePoints(m));

    // regression ci area
    const { ci, precision, plot } = this;
    const w = plot.innerWidth();
    this.areaData = ci ? data.flatMap(m => areaPoints(ci, precision, m, w)) : null;

    return this;
  }

  plotSpecs() {
    const { lineData, areaData, channels, ci } = this;
    const lopt = { x: 'x', y: 'y' };
    const aopt = { x: 'x', y1: 'y1', y2: 'y2', fillOpacity: 0.1 };

    for (const c of channels) {
      switch (c.channel) {
        case 'x':
        case 'y':
          break;
        case 'stroke':
          lopt.stroke = Object.hasOwn(c, 'value') ? c.value : c.channel;
          aopt.fill = Object.hasOwn(c, 'value') ? c.value : 'fill';
          break;
        case 'fillOpacity':
          aopt.fillOpacity = Object.hasOwn(c, 'value') ? c.value : c.channel;
          break;
        default:
          options[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
          break;
      }
    }

    return [
      ...(ci ? [{ type: 'areaY', data: areaData, options: aopt }] : []),
      { type: 'line', data: lineData, options: lopt }
    ]
  }
}

function linePoints(model) {
  const { x0, x1, intercept, slope, stroke } = model;
  return [
    { x: x0, y: intercept + x0 * slope, stroke },
    { x: x1, y: intercept + x1 * slope, stroke }
  ];
}

function areaPoints(ci, precision, model, width) {
  const {
    x0, x1, xm, intercept, slope, n, ssx, ssy,
    stroke: fill
  } = model;
  const pp = precision * (x1 - x0) / width;
  const t_sy = qt((1 - ci) / 2, n - 2) * Math.sqrt(ssy / (n - 2));
  return range(x0, x1 - pp / 2, pp)
    .concat(x1)
    .map(x => {
      const y = intercept + x * slope;
      const ye = t_sy * Math.sqrt(1 / n + (x - xm) ** 2 / ssx);
      return { x, y1: y - ye, y2: y + ye, fill };
    });
}
