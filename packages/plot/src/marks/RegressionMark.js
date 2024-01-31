import { range } from 'd3';
import {
  Query, max, min, castDouble, isNotNull,
  regrIntercept, regrSlope, regrCount,
  regrSYY, regrSXX, regrAvgX
} from '@uwdata/mosaic-sql';
import { qt } from './util/stats.js';
import { Mark, channelOption } from './Mark.js';
import { handleParam } from './util/handle-param.js';
import { toDataArray } from './util/to-data-array.js';

export class RegressionMark extends Mark {
  constructor(source, options) {
    const { ci = 0.95, precision = 4, ...channels } = options;
    super('line', source, channels);
    const update = () => {
      return this.modelFit ? this.confidenceBand().update() : null
    };
    handleParam(this, 'ci', ci, update);
    handleParam(this, 'precision', precision, update);
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
        x0: castDouble(min(x).where(isNotNull(y))),
        x1: castDouble(max(x).where(isNotNull(y)))
      })
      .select(groupby)
      .groupby(groupby);
  }

  queryResult(data) {
    this.modelFit = toDataArray(data);

    // regression line
    this.lineData = this.modelFit.flatMap(m => linePoints(m));

    // prepare confidence band
    return this.confidenceBand();
  }

  confidenceBand() {
    // regression ci area
    const { ci, modelFit, precision, plot } = this;
    const w = plot.innerWidth();
    this.areaData = ci ? modelFit.flatMap(m => areaPoints(ci, precision, m, w)) : null;
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
        case 'fill':
          break;
        case 'stroke':
          lopt.stroke = aopt.fill = channelOption(c);
          break;
        case 'strokeOpacity':
          lopt.strokeOpacity = channelOption(c);
          break;
        case 'fillOpacity':
          aopt.fillOpacity = channelOption(c);
          break;
        default:
          lopt[c.channel] = aopt[c.channel] = channelOption(c);
          break;
      }
    }

    return [
      ...(ci ? [{ type: 'areaY', data: areaData, options: aopt }] : []),
      { type: 'line', data: lineData, options: lopt }
    ];
  }
}

function linePoints(model) {
  // eslint-disable-next-line no-unused-vars
  const { x0, x1, xm, intercept, slope, n, ssx, ssy, ...rest } = model;
  return [
    { x: x0, y: intercept + x0 * slope, ...rest },
    { x: x1, y: intercept + x1 * slope, ...rest }
  ];
}

function areaPoints(ci, precision, model, width) {
  const { x0, x1, xm, intercept, slope, n, ssx, ssy, ...rest } = model;
  const pp = precision * (x1 - x0) / width;
  const t_sy = qt((1 - ci) / 2, n - 2) * Math.sqrt(ssy / (n - 2));
  return range(x0, x1 - pp / 2, pp)
    .concat(x1)
    .map(x => {
      const y = intercept + x * slope;
      const ye = t_sy * Math.sqrt(1 / n + (x - xm) ** 2 / ssx);
      return { x, y1: y - ye, y2: y + ye, ...rest };
    });
}
