import { interpolatorBarycentric, interpolateNearest, interpolatorRandomWalk } from '@observablehq/plot';
import { toDataColumns } from '@uwdata/mosaic-core';
import { ExprNode, Query, bin2d, binLinear2d, collectColumns, count, isAggregateExpression, isBetween, lt, lte, sum } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binExpr } from './util/bin-expr.js';
import { dericheConfig, dericheConv2d } from './util/density.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { grid2d } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Mark } from './Mark.js';

export const DENSITY = 'density';

export class Grid2DMark extends Mark {
  constructor(type, source, options) {
    const {
      bandwidth = 0,
      interpolate = 'none',
      pixelSize = 1,
      pad = 1,
      width,
      height,
      ...channels
    } = options;

    const densityMap = createDensityMap(channels);
    super(type, source, channels, xyext);
    this.densityMap = densityMap;

    /** @type {number} */
    this.bandwidth = handleParam(bandwidth, value => {
      this.bandwidth = value;
      return this.grids ? this.convolve().update() : null;
    });

    /** @type {string} */
    this.interpolate = handleParam(interpolate, value => {
      return (this.interpolate = value, this.requestUpdate());
    });

    /** @type {number} */
    this.pixelSize = handleParam(pixelSize, value => {
      return (this.pixelSize = value, this.requestUpdate());
    });

    /** @type {number} */
    this.pad = handleParam(pad, value => {
      return (this.pad = value, this.requestUpdate());
    });

    /** @type {number|undefined} */
    this.width = handleParam(width, value => {
      return (this.width = value, this.requestUpdate());
    });

    /** @type {number|undefined} */
    this.height = handleParam(height, value => {
      return (this.height = value, this.requestUpdate());
    });
  }

  /**
   * @param {import('../plot.js').Plot} plot The plot.
   * @param {number} index
   */
  setPlot(plot, index) {
    const update = () => { if (this.hasFieldInfo()) this.requestUpdate(); };
    plot.addAttributeListener('xDomain', update);
    plot.addAttributeListener('yDomain', update);
    super.setPlot(plot, index);
  }

  get filterStable() {
    const xdom = this.plot.getAttribute('xDomain');
    const ydom = this.plot.getAttribute('yDomain');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter = []) {
    const { interpolate, pad, channels, densityMap } = this;
    const [x0, x1] = this.extentX = extentX(this, filter);
    const [y0, y1] = this.extentY = extentY(this, filter);
    const [nx, ny] = this.bins = this.binDimensions();
    const [x, bx] = binExpr(this, 'x', nx, [x0, x1], pad);
    const [y, by] = binExpr(this, 'y', ny, [y0, y1], pad);

    // with padded bins, include the entire domain extent
    // if the bins are flush, exclude the extent max
    const bounds = pad
      ? [isBetween(bx, [+x0, +x1]), isBetween(by, [+y0, +y1])]
      : [lte(+x0, bx), lt(bx, +x1), lte(+y0, by), lt(by, +y1)];

    const q = Query
      .from(this.sourceTable())
      .where(filter.concat(bounds));

    /** @type {string[]} */
    const groupby = this.groupby = [];
    /** @type {Record<string, ExprNode>} */
    const aggrMap = {};
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { as, channel, field } = c;
        if (isAggregateExpression(field)) {
          // include custom aggregate
          aggrMap[channel] = field;
          densityMap[channel] = true;
        } else if (channel === 'weight') {
          // compute weighted density
          aggrMap[DENSITY] = sum(field);
        } else if (channel !== 'x' && channel !== 'y') {
          // add groupby field
          q.select({ [as]: field });
          groupby.push(as);
        }
      }
    }
    const aggr = this.aggr = Object.keys(aggrMap);

    // check for incompatible encodings
    if (aggrMap.density && aggr.length > 1) {
      throw new Error('Weight option can not be used with custom aggregates.');
    }

    // if no aggregates, default to count density
    if (!aggr.length) {
      aggr.push(DENSITY);
      aggrMap[DENSITY] = count();
    }

    // generate grid binning query
    if (interpolate === 'linear') {
      if (aggr.length > 1) {
        throw new Error('Linear binning not applicable to multiple aggregates.');
      }
      if (!aggrMap[DENSITY]) {
        throw new Error('Linear binning not applicable to custom aggregates.');
      }
      const weight = collectColumns(aggrMap[DENSITY])[0];
      return binLinear2d(q, x, y, weight, nx, groupby);
    } else {
      return bin2d(q, x, y, aggrMap, nx, groupby);
    }
  }

  /**
   * @returns {[number, number]} The bin dimensions.
   */
  binDimensions() {
    const { plot, pixelSize, width, height } = this;
    return [
      width ?? Math.round(plot.innerWidth() / pixelSize),
      height ?? Math.round(plot.innerHeight() / pixelSize)
    ];
  }

  queryResult(data) {
    const [w, h] = this.bins;
    const interp = maybeInterpolate(this.interpolate);
    const { columns } = toDataColumns(data);
    this.grids0 = grid2d(w, h, columns.index, columns, this.aggr, this.groupby, interp);
    return this.convolve();
  }

  convolve() {
    const { aggr, bandwidth, bins, grids0, plot } = this;

    // no smoothing as default fallback
    this.grids = grids0;

    if (bandwidth > 0) {
      // determine which grid to smooth
      const prop = aggr.length === 1 ? aggr[0]
        : aggr.includes(DENSITY) ? DENSITY
        : null;

      // bail if no compatible grid found
      if (!prop) {
        console.warn('No compatible grid found for smoothing.');
        return this;
      }
      const g = grids0.columns[prop];

      // apply smoothing, bandwidth uses units of screen pixels
      const w = plot.innerWidth();
      const h = plot.innerHeight();
      const [nx, ny] = bins;
      const neg = g.some(grid => grid.some(v => v < 0));
      const configX = dericheConfig(bandwidth * (nx - 1) / w, neg);
      const configY = dericheConfig(bandwidth * (ny - 1) / h, neg);
      this.grids = {
        numRows: grids0.numRows,
        columns: {
          ...grids0.columns,
          // @ts-ignore
          [prop]: g.map(grid => dericheConv2d(configX, configY, grid, bins))
        }
      };
    }

    return this;
  }
}

/**
 * Extract channels that explicitly encode computed densities.
 */
function createDensityMap(channels) {
  const densityMap = {};
  for (const key in channels) {
    if (channels[key] === 'density') {
      delete channels[key];
      densityMap[key] = true;
    }
  }
  return densityMap;
}

function maybeInterpolate(interpolate = 'none') {
  if (typeof interpolate === 'function') return interpolate;
  switch (interpolate.toLowerCase()) {
    case 'none':
    case 'linear':
      return undefined; // no special interpolation need
    case 'nearest':
      return interpolateNearest;
    case 'barycentric':
      return interpolatorBarycentric();
    case 'random-walk':
      return interpolatorRandomWalk();
  }
  throw new Error(`invalid interpolate: ${interpolate}`);
}
