import { isSignal } from '../../mosaic/index.js';
import { Query, gt, sum, expr, isBetween } from '../../sql/index.js';
import { dericheConfig, dericheConv1d, grid1d } from './util/deriche.js';
import { Mark } from './Mark.js';

export class DensityMark extends Mark {
  constructor(type, source, options) {
    const { bins = 1024, bandwidth = 0.1, ...channels } = options;
    super(type, source, channels);
    this.bins = bins;
    this.bandwidth = bandwidth;

    if (isSignal(bandwidth)) {
      bandwidth.addListener('value', value => {
        this.bandwidth = value;
        if (this.grid) this.convolve().update();
      });
      this.bandwidth = bandwidth.value;
    }
    // TODO: nrd estimate from stats? (requires quantiles and stdev)
    // TODO: perform binning in JS if data is set
  }

  query(filter = []) {
    const { bins, plot, stats } = this;
    const dir = 'x'; // TODO
    const { column } = this.channelField(dir);
    const weight = this.channelField('weight') ? 'weight' : 1;

    let { min, max } = stats.find(s => s.column === column);
    const domX = plot.getAttribute('domainX');
    if (Array.isArray(domX)) {
      [min, max] = domX;
    }
    this.extent = [min, max];

    return binLinear1d(super.query(filter), 'x', min, max, bins, weight);
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
  const p = expr(`(${x} - ${lo}) * ${(n - 1) / (hi - lo)}::DOUBLE`);

  const u = Query
    .select({ p, i: expr('FLOOR(p)'), w: expr(`(i + 1 - p)${w}`) })
    .from(input)
    .where(isBetween(x, [lo, hi]));

  const v = Query
    .select({ p, i: expr('FLOOR(p) + 1'), w: expr(`(p - FLOOR(p))${w}`) })
    .from(input)
    .where(isBetween(x, [lo, hi]));

  return Query
    .from(Query.unionAll(u, v))
    .select({ index: 'i', weight: sum('w') })
    .groupby('index')
    .having(gt('weight', 0));
}
