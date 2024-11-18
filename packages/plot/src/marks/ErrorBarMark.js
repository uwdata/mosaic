import { toDataColumns } from '@uwdata/mosaic-core';
import { avg, count, div, sqrt, stddev } from '@uwdata/mosaic-sql';
import { erfinv } from './util/stats.js';
import { Mark, markPlotSpec, markQuery } from './Mark.js';
import { handleParam } from './util/handle-param.js';

export class ErrorBarMark extends Mark {
  constructor(type, source, options) {
    const dim = type.endsWith('X') ? 'y' : 'x';
    const { ci = 0.95, ...channels } = options;
    super(type, source, channels);
    this.dim = dim;
    this.field = this.channelField(dim).field;
    this.channels = this.channels.filter(c => c.channel !== dim);

    /** @type {number} */
    this.ci = handleParam(ci, value => {
      return (this.ci = value, this.update());
    });
  }

  query(filter = []) {
    const { channels, field } = this;
    const fields = channels.concat([
      { field: avg(field), as: '__avg__' },
      { field: div(stddev(field), sqrt(count(field))), as: '__se__', }
    ]);
    return markQuery(fields, this.sourceTable()).where(filter);
  }

  queryResult(data) {
    this.data = toDataColumns(data);
    return this;
  }

  plotSpecs() {
    const { type, dim, detail, data, ci, channels } = this;

    // compute confidence interval channels
    const p = Math.SQRT2 * erfinv(ci);
    const { columns: { __avg__: u, __se__: s } } = data;
    const options = {
      [`${dim}1`]: u.map((u, i) => u - p * s[i]),
      [`${dim}2`]: u.map((u, i) => u + p * s[i])
    };

    return markPlotSpec(type, detail, channels, data, options);
  }
}
