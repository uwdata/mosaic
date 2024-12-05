import { toDataColumns } from '@uwdata/mosaic-core';
import { binLinear1d, isBetween } from '@uwdata/mosaic-sql';
import { max, sum } from 'd3';
import { Transient } from '../symbols.js';
import { binExpr } from './util/bin-expr.js';
import { dericheConfig, dericheConv1d } from './util/density.js';
import { extentX, extentY, xext, yext } from './util/extent.js';
import { grid1d } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Mark, channelOption, markQuery } from './Mark.js';

const GROUPBY = { fill: 1, stroke: 1, z: 1 };

export class Density1DMark extends Mark {
  constructor(type, source, options) {
    const {
      bins = 1024,
      bandwidth = 20,
      normalize = false,
      stack = false,
      ...channels
    } = options;
    const dim = type.endsWith('X') ? 'y' : 'x';

    super(type, source, channels, dim === 'x' ? xext : yext);
    this.dim = dim;

    /** @type {number} */
    this.bins = handleParam(bins, value => {
      return (this.bins = value, this.requestUpdate());
    });

    /** @type {number} */
    this.bandwidth = handleParam(bandwidth, value => {
      this.bandwidth = value;
      return this.grids ? this.convolve().update() : null;
    });

    /** @type {string | boolean} */
    this.normalize = handleParam(normalize, value => {
      return (this.normalize = value, this.convolve().update());
    });

    /** @type {boolean} */
    this.stack = handleParam(stack, value => {
      return (this.stack = value, this.update());
    });
  }

  get filterStable() {
    const name = this.dim === 'x' ? 'xDomain' : 'yDomain';
    const dom = this.plot.getAttribute(name);
    return dom && !dom[Transient];
  }

  query(filter = []) {
    if (this.hasOwnData()) throw new Error('Density1DMark requires a data source');
    const { bins, channels, dim } = this;
    const extent = this.extent = (dim === 'x' ? extentX : extentY)(this, filter);
    const [x, bx] = binExpr(this, dim, bins, extent);
    const q = markQuery(channels, this.sourceTable(), [dim])
      .where(filter.concat(isBetween(bx, extent)));
    const v = this.channelField('weight') ? 'weight' : null;
    const g = this.groupby = channels.flatMap(c => {
      return (GROUPBY[c.channel] && c.field) ? c.as : [];
    });
    return binLinear1d(q, x, v, g);
  }

  queryResult(data) {
    const c = toDataColumns(data).columns;
    this.grids = grid1d(this.bins, c.index, c.density, c, this.groupby);
    return this.convolve();
  }

  convolve() {
    const {
      bins, bandwidth, normalize, dim, grids, groupby, plot, extent: [lo, hi]
    } = this;

    const cols = grids.columns;
    const numGrids = grids.numRows;

    const b = this.channelField(dim).as;
    const v = dim === 'x' ? 'y' : 'x';
    const size = dim === 'x' ? plot.innerWidth() : plot.innerHeight();
    const neg = cols._grid.some(grid => grid.some(v => v < 0));
    const config = dericheConfig(bandwidth * (bins - 1) / size, neg);

    const b0 = +lo;
    const delta = (hi - b0) / (bins - 1);

    const numRows = bins * numGrids;
    const _b = new Float64Array(numRows);
    const _v = new Float64Array(numRows);
    const _g = groupby.reduce((m, name) => (m[name] = Array(numRows), m), {});

    for (let k = 0, g = 0; g < numGrids; ++g) {
      // fill in groupby values
      groupby.forEach(name => _g[name].fill(cols[name][g], k, k + bins));

      // perform smoothing, map smoothed grid values to sample data points
      const grid = cols._grid[g];
      const result = dericheConv1d(config, grid, bins);
      const scale = 1 / norm(grid, result, delta, normalize);
      for (let i = 0; i < bins; ++i, ++k) {
        _b[k] = b0 + i * delta;
        _v[k] = result[i] * scale;
      }
    }

    this.data = { numRows, columns: { [b]: _b, [v]: _v, ..._g } };
    return this;
  }

  plotSpecs() {
    const { type, data: { numRows: length, columns }, channels, dim, stack } = this;

    // control if Plot's implicit stack transform is applied
    // no stacking is done if x2/y2 are used instead of x/y
    const _ = type.startsWith('area') && !stack ? '2' : '';
    const options = dim === 'x' ? { [`y${_}`]: columns.y } : { [`x${_}`]: columns.x };

    for (const c of channels) {
      options[c.channel] = channelOption(c, columns);
    }
    return [{ type, data: { length }, options }];
  }
}

function norm(grid, smoothed, delta, type) {
  const value = type === true || type === 'sum' ? sum(grid)
    : type === 'max' ? max(smoothed)
    : delta;
  return value || 1;
}
