import { range } from 'd3';
import { toDataColumns } from '@uwdata/mosaic-core';
import {
  Query, max, min, float64, isNotNull,
  regrIntercept, regrSlope, regrCount,
  regrSYY, regrSXX, regrAvgX
} from '@uwdata/mosaic-sql';
import { qt } from './util/stats.js';
import { Mark, channelOption } from './Mark.js';
import { handleParam } from './util/handle-param.js';

export class RegressionMark extends Mark {
  constructor(source, options) {
    const { ci = 0.95, precision = 4, ...channels } = options;
    super('line', source, channels);

    const update = () => this.modelFit ? this.confidenceBand().update() : null;

    /** @type {number} */
    this.ci = handleParam(ci, value => {
      return (this.ci = value, update());
    });

    /** @type {number} */
    this.precision = handleParam(precision, value => {
      return (this.precision = value, update());
    });
  }

  query(filter = []) {
    const x = this.channelField('x').as;
    const y = this.channelField('y').as;
    const groupby = Array.from(new Set(
      ['stroke', 'z', 'fx', 'fy'].flatMap(c => this.channelField(c)?.as || [])
    ));

    return Query
      .from(super.query(filter))
      .select({
        intercept: regrIntercept(y, x),
        slope: regrSlope(y, x),
        n: regrCount(y, x),
        ssy: regrSYY(y, x),
        ssx: regrSXX(y, x),
        xm: regrAvgX(y, x),
        x0: float64(min(x).where(isNotNull(y))),
        x1: float64(max(x).where(isNotNull(y)))
      })
      .select(groupby)
      .groupby(groupby);
  }

  queryResult(data) {
    this.modelFit = toDataColumns(data);

    // regression line
    this.lineData = linePoints(this.modelFit);

    // prepare confidence band
    return this.confidenceBand();
  }

  confidenceBand() {
    // regression ci area
    const { ci, modelFit, precision, plot } = this;
    const width = plot.innerWidth();
    this.areaData = ci ? areaPoints(modelFit, ci, precision, width) : null;
    return this;
  }

  plotSpecs() {
    const { lineData, areaData, channels, ci } = this;
    const lcols = lineData.columns;
    const acols = ci ? areaData.columns : {};
    const lopt = { x: lcols.x, y: lcols.y };
    const aopt = { x: acols.x, y1: acols.y1, y2: acols.y2, fillOpacity: 0.1 };

    for (const c of channels) {
      switch (c.channel) {
        case 'x':
        case 'y':
        case 'fill':
          break;
        case 'tip':
          aopt.tip = channelOption(c, acols);
          break;
        case 'stroke':
          lopt.stroke = channelOption(c, lcols);
          aopt.fill = channelOption(c, acols);
          break;
        case 'strokeOpacity':
          lopt.strokeOpacity = channelOption(c, lcols);
          break;
        case 'fillOpacity':
          aopt.fillOpacity = channelOption(c, acols);
          break;
        default:
          lopt[c.channel] = channelOption(c, lcols);
          aopt[c.channel] = channelOption(c, acols);
          break;
      }
    }

    return [
      ...(ci ? [{ type: 'areaY', data: { length: areaData.numRows }, options: aopt }] : []),
      { type: 'line', data: { length: lineData.numRows }, options: lopt }
    ];
  }
}

function concat(a, b) {
  if (a.concat) return a.concat(b);
  const array = new (a.constructor)(a.length + b.length);
  array.set(a, 0);
  array.set(b, a.length);
  return array;
}

function linePoints(fit) {
  // eslint-disable-next-line no-unused-vars
  const { x0 = [], x1 = [], xm, intercept, slope, n, ssx, ssy, ...rest } = fit.columns;
  const predict = (x, i) => intercept[i] + x * slope[i];
  const x = concat(x0, x1);
  const y = concat(x0.map(predict), x1.map(predict));
  for (const name in rest) {
    rest[name] = concat(rest[name], rest[name]);
  }
  return { numRows: x.length, columns: { x, y, ...rest } };
}

function areaPoints(fit, ci, precision, width) {
  const len = fit.numRows;
  const { x0, x1, xm, intercept, slope, n, ssx, ssy, ...rest } = fit.columns;
  const other = Object.keys(rest);
  const columns = { x: [], y1: [], y2: [] };
  other.forEach(name => columns[name] = []);

  for (let i = 0; i < len; ++i) {
    const pp = precision * (x1[i] - x0[i]) / width;
    const t_sy = qt((1 - ci) / 2, n[i] - 2) * Math.sqrt(ssy[i] / (n[i] - 2));
    range(x0[i], x1[i] - pp / 2, pp).concat(x1[i]).forEach(x => {
      const y = intercept[i] + x * slope[i];
      const ye = t_sy * Math.sqrt(1 / n[i] + (x - xm[i]) ** 2 / ssx[i]);
      columns.x.push(x);
      columns.y1.push(y - ye);
      columns.y2.push(y + ye);
      other.forEach(name => columns[name].push(rest[name][i]));
    });
  }

  return { numRows: columns.x.length, columns };
}
