import { Query, gt, isBetween, sql, sum } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binExpr } from './util/bin-expr.js';
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
    const extent = this.extent = (dim === 'x' ? extentX : extentY)(this, filter);
    const [x, bx] = binExpr(this, dim, bins, extent);
    const q = markQuery(channels, table, [dim])
      .where(filter.concat(isBetween(bx, extent)));
    const v = this.channelField('weight') ? 'weight' : null;
    return binLinear1d(q, x, v);
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
    const v = dim === 'x' ? 'y' : 'x';
    const b = this.channelField(dim).as;
    const b0 = +lo;
    const delta = (hi - b0) / (bins - 1);
    const scale = 1 / delta;

    const _b = new Float64Array(bins);
    const _v = new Float64Array(bins);
    for (let i = 0; i < bins; ++i) {
      _b[i] = b0 + i * delta;
      _v[i] = result[i] * scale;
    }
    this.data = { numRows: bins, columns: { [b]: _b, [v]: _v } };

    return this;
  }

  plotSpecs() {
    const { type, data: { numRows: length, columns }, channels, dim } = this;
    const options = dim === 'x' ? { y: columns.y } : { x: columns.x };
    for (const c of channels) {
      options[c.channel] = channelOption(c, columns);
    }
    return [{ type, data: { length }, options }];
  }
}

function binLinear1d(q, p, density) {
  const w = density ? `* ${density}` : '';

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
    .select({ index: 'i', density: sum('w') })
    .groupby('index')
    .having(gt('density', 0));
}
