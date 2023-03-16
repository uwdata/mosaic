import { range } from 'd3';
import {
  Query, maxInt, minInt, isNotNull,
  regrIntercept, regrSlope, regrCount,
  regrR2, regrSYY, regrSXX, regrAvgX
} from '@uwdata/mosaic-sql';
import { qt } from './util/stats.js';
import { Mark } from './Mark.js';
import { handleParam } from './util/handle-param.js';

export class RegressionMark extends Mark {
  constructor(source, options) {
    const { ci = 0.95, precision = 4, ...channels } = options;
    super('line', source, channels);
    const update = () => {
      return this.data ? this.confidenceBand().update() : null
    };
    handleParam(this, 'ci', ci, update);
    handleParam(this, 'precision', precision, update);
  }

  query(filter = []) {
    const x = 'x';
    const y = 'y';
    const groupby = ['stroke', 'z', 'fx', 'fy']
      .flatMap(c => this.channelField(c) ? c : []);

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
        x0: minInt(x).where(isNotNull(y)),
        x1: maxInt(x).where(isNotNull(y))
      })
      .select(groupby)
      .groupby(groupby);
  }

  queryResult(data) {
    data = Array.from(data);

    // regression line
    this.data = data.flatMap(m => linePoints(m));

    // prepare confidence band
    return this.confidenceBand();
  }

  confidenceBand() {
    // regression ci area
    const { ci, data, precision, plot } = this;
    const w = plot.innerWidth();
    this.areaData = ci ? data.flatMap(m => areaPoints(ci, precision, m, w)) : null;
    return this;
  }

  plotSpecs() {
    const { data, areaData, channels, ci } = this;
    const lopt = { x: 'x', y: 'y' };
    const aopt = { x: 'x', y1: 'y1', y2: 'y2', fillOpacity: 0.1 };

    for (const c of channels) {
      switch (c.channel) {
        case 'x':
        case 'y':
        case 'fill':
          break;
        case 'stroke':
          lopt.stroke = Object.hasOwn(c, 'value') ? c.value : 'stroke';
          aopt.fill = Object.hasOwn(c, 'value') ? c.value : 'fill';
          break;
        case 'strokeOpacity':
          lopt.strokeOpacity = Object.hasOwn(c, 'value') ? c.value : c.channel;
          break;
        case 'fillOpacity':
          aopt.fillOpacity = Object.hasOwn(c, 'value') ? c.value : c.channel;
          break;
        default:
          lopt[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
          aopt[c.channel] = lopt[c.channel];
          break;
      }
    }

    return [
      ...(ci ? [{ type: 'areaY', data: areaData, options: aopt }] : []),
      { type: 'line', data, options: lopt }
    ];
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
