import { toDataColumns } from '@uwdata/mosaic-core';
import { avg, count, div, sqrt, stddev } from '@uwdata/mosaic-sql';
import { erfinv } from './util/stats.js';
import { Mark, markPlotSpec, markQuery, type Field, type PlotMarkSpec } from './Mark.js';
import { handleParam } from './util/handle-param.js';
import type * as msql from '@uwdata/mosaic-sql';

export class ErrorBarMark extends Mark {
  dim: 'x' | 'y';
  field: Field;
  ci: number;
  constructor(type: 'ruleX' | 'ruleY', source: any, options: Record<string, any> = {}) {
    const dim = type.endsWith('X') ? 'y' : 'x';
    const { ci = 0.95, ...channels } = options;
    super(type, source, channels);
    this.dim = dim;
    this.field = this.channelField(dim).field;
    this.channels = this.channels.filter(c => c.channel !== dim);
    this.ci = handleParam(ci, value => {
      return (this.ci = value, this.update());
    });
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery {
    const { channels, field } = this;
    //@ts-ignore both fields are missing a required `channel` field. Error isn't showing on CLI
    const fields = channels.concat([
      //@ts-expect-error Type '{ stats?: { stats?: Stat[]; column?: FieldRef; }; basis?: unknown; }' is not assignable to type 'ExprValue'.
      { field: avg(field), as: '__avg__' },
      //@ts-expect-error Type '{ stats?: { stats?: Stat[]; column?: FieldRef; }; basis?: unknown; }' is not assignable to type 'ExprValue'.
      { field: div(stddev(field), sqrt(count(field))), as: '__se__', }
    ]);
    return markQuery(fields, this.sourceTable()).where(filter);
  }

  queryResult(data: unknown): this {
    this.data = toDataColumns(data);
    return this;
  }

  plotSpecs(): PlotMarkSpec[] {
    const { type, dim, detail, data, ci, channels } = this;

    // compute confidence interval channels
    const p = Math.SQRT2 * erfinv(ci);
    // @ts-expect-error Correct the data column type
    const { columns: { __avg__: u, __se__: s } } = data;
    const options = {
      [`${dim}1`]: u.map((u: number, i: number) => u - p * s[i]),
      [`${dim}2`]: u.map((u: number, i: number) => u + p * s[i])
    };

    return markPlotSpec(type, detail, channels, data, options);
  }
}
