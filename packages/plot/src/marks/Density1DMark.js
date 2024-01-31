import { Query, gt, isBetween, sql, sum } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binField, bin1d } from './util/bin-field.js';
import { dericheConfig, dericheConv1d } from './util/density.js';
import { extentX, extentY, xext, yext } from './util/extent.js';
import { grid1d } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Mark, channelOption, markQuery } from './Mark.js';

export class Density1DMark extends Mark {
  constructor(type, source, options) {
    const { bins = 1024, bandwidth = 20, ...channels } = options;
    const dim = type.endsWith('X') ? 'y' : 'x';

    super(type, source, channels, dim === 'x' ? xext : yext);
    this.dim = dim;

    handleParam(this, 'bins', bins);
    handleParam(this, 'bandwidth', bandwidth, () => {
      return this.grid ? this.convolve().update() : null
    });
  }

  get filterIndexable() {
    const name = this.dim === 'x' ? 'xDomain' : 'yDomain';
    const dom = this.plot.getAttribute(name);
    return dom && !dom[Transient];
  }

  query(filter = []) {
    if (this.hasOwnData()) throw new Error('Density1DMark requires a data source');
    const { bins, channels, dim, source: { table } } = this;
    const [lo, hi] = this.extent = (dim === 'x' ? extentX : extentY)(this, filter);
    const bx = binField(this, dim);
    return binLinear1d(
      markQuery(channels, table, [dim])
        .where(filter.concat(isBetween(bx, [lo, hi]))),
      bin1d(bx, lo, hi, bins),
      this.channelField('weight') ? 'weight' : null
    );
  }

  queryResult(data) {
    this.grid = grid1d(this.bins, data);
    return this.convolve();
  }

  convolve() {
    const { bins, bandwidth, dim, grid, plot, extent: [lo, hi] } = this;

    // perform smoothing
    const neg = grid.some(v => v < 0);
    const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();
    const config = dericheConfig(bandwidth * (bins - 1) / size, neg);
    const result = dericheConv1d(config, grid, bins);

    // map smoothed grid values to sample data points
    const points = this.data = [];
    const v = dim === 'x' ? 'y' : 'x';
    const b = this.channelField(dim).as;
    const b0 = +lo;
    const delta = (hi - b0) / (bins - 1);
    const scale = 1 / delta;
    for (let i = 0; i < bins; ++i) {
      points.push({
        [b]: b0 + i * delta,
        [v]: result[i] * scale
      });
    }

    return this;
  }

  plotSpecs() {
    const { type, data, channels, dim } = this;
    const options = dim === 'x' ? { y: 'y' } : { x: 'x' };
    for (const c of channels) {
      options[c.channel] = channelOption(c);
    }
    return [{ type, data, options }];
  }
}

function binLinear1d(q, p, value) {
  const w = value ? `* ${value}` : '';

  const u = q.clone().select({
    p,
    i: sql`FLOOR(p)::INTEGER`,
    w: sql`(FLOOR(p) + 1 - p)${w}`
  });

  const v = q.clone().select({
    p,
    i: sql`FLOOR(p)::INTEGER + 1`,
    w: sql`(p - FLOOR(p))${w}`
  });

  return Query
    .from(Query.unionAll(u, v))
    .select({ index: 'i', value: sum('w') })
    .groupby('index')
    .having(gt('value', 0));
}
