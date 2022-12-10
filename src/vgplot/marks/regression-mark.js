import { range } from 'd3';
import { Mark } from '../mark.js';
import { qt } from '../util/stats.js';

export class RegressionMark extends Mark {
  constructor(source, encodings) {
    super('line', source, { ...encodings });
    this.ci = 0.95;
    this.precision = 4;
    this.color = 'stroke';
  }

  data(data) {
    const { color } = this; // TODO: only use this when in vis spec

    // regression line
    this._data = data.flatMap(m => linePoints(m, { [color]: m[color] }));

    // regression ci
    // const { ci, precision } = this;
    // this._data = data.flatMap(m => areaPoints(ci, precision, m, { [color]: m[color] }));

    return this;
  }

  query() {
    const q = super.query();
    const g = this.channelField(this.color);
    q.transform = [
      {
        type: 'linearRegression',
        x: 'x',
        y: 'y',
        ...(g ? { groupby: [this.color] } : {})
      }
    ];
    return q;
  }

  // toSpec() {
  //   const { type, _data, channels } = this;
  //   const options = { y1: 'y1', y2: 'y2' };
  //   for (const c of channels) {
  //     if (c.channel === 'y') continue;
  //     options[c.channel] = Object.hasOwn(c, 'value')
  //       ? c.value
  //       : c.channel;
  //   }
  //   return { type, data: _data, options };
  // }
}

function linePoints(model, dims) {
  const { x0, x1, intercept, slope } = model;
  return [
    { x: x0, y: intercept + x0 * slope, ...dims },
    { x: x1, y: intercept + x1 * slope, ...dims }
  ];
}

function areaPoints(ci, precision, model, dims) {
  const { x0, x1, xm, intercept, slope, n, ssx, ssy } = model;
  const t_sy = qt((1 - ci) / 2, n - 2) * Math.sqrt(ssy / (n - 2));
  return range(x0, x1 - precision / 2, precision)
    .concat(x1)
    .map(x => {
      const y = intercept + x * slope;
      const ye = t_sy * Math.sqrt(1 / n + (x - xm) ** 2 / ssx);
      return { x, y1: y - ye, y2: y + ye, ...dims };
    });
}
