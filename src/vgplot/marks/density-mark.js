import { isSignal } from '../../mosaic/Signal.js';
import { Mark } from '../mark.js';
import { dericheConfig, dericheConv1d, grid1d } from '../util/deriche.js';

export class DensityMark extends Mark {
  constructor(type, source, options) {
    const { bins = 1024, bandwidth = 0.1, ...channels } = options;
    super(type, source, channels);
    this.bins = bins;
    this.bandwidth = bandwidth;

    if (isSignal(bandwidth)) {
      bandwidth.addListener(value => {
        this.bandwidth = value;
        if (this.grid) this.convolve().update();
      });
      this.bandwidth = bandwidth.value;
    }
    // TODO: nrd estimate from stats? (requires quantiles and stdev)
    // TODO: perform binning in JS if _data is set
  }

  data(data) {
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

    const points = this._data = [];
    for (let i = 0; i < bins; ++i) {
      points.push({
        x: lo + i * delta,
        y: result[i] * scale
      });
    }

    return this;
  }

  query() {
    const { bins, plot, _stats } = this;
    const q = super.query();
    const dir = 'x'; // TODO
    const field = q.select[dir].field;
    const weight = q.select.weight ? 'weight' : 1;

    let { min, max } = _stats.find(s => s.field === field);
    const domX = plot.getAttribute('domainX');
    if (Array.isArray(domX)) {
      [min, max] = domX;
    }
    this.extent = [min, max];

    q.transform = [
      {
        type: 'binInterp',
        field: dir,
        weight,
        bins,
        range: this.extent
      }
    ];

    return q;
  }

  plotSpecs() {
    const { type, _data, channels } = this;
    const options = { y: 'y' };
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value')
        ? c.value
        : c.channel;
    }
    return [{ type, data: _data, options }];
  }
}
