import { isSignal } from '@uwdata/mosaic-core';
import { Query, gt, sum, expr, isBetween } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { dericheConfig, dericheConv1d, grid1d } from './util/density.js';
import { extentX, extentY } from './util/extent.js';
import { Mark } from './Mark.js';

export class Density1DMark extends Mark {
  constructor(type, source, options) {
    const { bins = 1024, bandwidth = 0.1, ...channels } = options;
    super(type, source, channels);
    this.bins = bins;
    this.bandwidth = bandwidth;

    if (isSignal(bandwidth)) {
      bandwidth.addEventListener('value', value => {
        this.bandwidth = value;
        if (this.grid) this.convolve().update();
      });
      this.bandwidth = bandwidth.value;
    }
    // TODO: nrd estimate from stats? (requires quantiles and stdev)
    // TODO: perform binning in JS if data is set?
  }

  get filterIndexable() {
    const name = 'domainX'; // TODO: support transpose
    const dom = this.plot.getAttribute(name);
    return dom && !dom[Transient];
  }

  query(filter = []) {
    const dir = 'x'; // TODO: support transpose
    this.extent = (dir === 'x' ? extentX : extentY)(this, filter);
    const [lo, hi] = this.extent;
    const weight = this.channelField('weight') ? 'weight' : 1;
    return binLinear1d(super.query(filter), 'x', lo, hi, this.bins, weight);
  }

  queryResult(data) {
    this.grid = grid1d(this.bins, data);
    return this.convolve();
  }

  convolve() {
    const { bins, bandwidth, grid, extent: [lo, hi] } = this;
    const neg = grid.some(v => v < 0);
    const delta = (hi - lo) / (bins - 1);
    const scale = 1 / delta;
    const config = dericheConfig(bandwidth * scale, neg);
    const result = dericheConv1d(config, grid, bins);

    const points = this.data = [];
    for (let i = 0; i < bins; ++i) {
      points.push({
        x: lo + i * delta,
        y: result[i] * scale
      });
    }

    return this;
  }

  plotSpecs() {
    const { type, data, channels } = this;
    const options = { y: 'y' };
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
    }
    return [{ type, data, options }];
  }
}

function binLinear1d(input, x, lo, hi, n, weight) {
  const w = weight && weight !== 1 ? `* ${weight}` : '';
  const p = expr(`(${x} - ${lo}::DOUBLE) * ${(n - 1) / (hi - lo)}::DOUBLE`);

  const u = Query
    .select({ p, i: expr('FLOOR(p)::INTEGER'), w: expr(`(i + 1 - p)${w}`) })
    .from(input)
    .where(isBetween(x, [lo, hi]));

  const v = Query
    .select({ p, i: expr('FLOOR(p)::INTEGER + 1'), w: expr(`(p - FLOOR(p))${w}`) })
    .from(input)
    .where(isBetween(x, [lo, hi]));

  return Query
    .from(Query.unionAll(u, v))
    .select({ index: 'i', weight: sum('w') })
    .groupby('index')
    .having(gt('weight', 0));
}
