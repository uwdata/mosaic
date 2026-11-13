import { ExprNode } from '@uwdata/mosaic-sql';
import type * as mc from '@uwdata/mosaic-core';
import type * as ObPlot from '@observablehq/plot';
import { interpolatorBarycentric, interpolateNearest, interpolatorRandomWalk } from '@observablehq/plot';
import { toDataColumns } from '@uwdata/mosaic-core';
import { Query, bin2d, binLinear2d, collectColumns, count, isAggregateExpression, isBetween, lt, lte, sum } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binExpr } from './util/bin-expr.js';
import { dericheConfig, dericheConv2d } from './util/density.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { grid2d } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Mark, type EncodingName, type Encodings } from './Mark.js';
import type { Plot } from '../plot.js';
import type * as msql from '@uwdata/mosaic-sql';
import type { CanParam } from '../types.js';

export const DENSITY = 'density';

type GridInterpolate =
  | 'none'
  | 'linear'
  | 'nearest'
  | 'barycentric'
  | 'random-walk';


export interface Grid2DOptions {
  x?: unknown;
  y?: unknown;
  width?: CanParam<number>;
  height?: CanParam<number>;
  pixelSize?: CanParam<number>;
  pad?: CanParam<number>;
  bandwidth?: CanParam<number>;
  interpolate?: CanParam<GridInterpolate | null>;
}

type Grids = { numRows: number; columns: Record<string, mc.Arrayish>;[prop: string]: any; };

export class Grid2DMark extends Mark {
  densityMap: Encodings;
  bandwidth: number;
  grids?: Grids;
  interpolate: GridInterpolate;
  pixelSize: number;
  pad: number;
  width: number;
  height: number;
  extentX?: any[];
  extentY?: any[];
  bins?: [number, number];
  groupby?: string[];
  aggr?: string[];
  grids0?: Grids;
  constructor(type: 'dot' | 'geo' | 'image' | 'circle' | 'hexagon' | 'cell' | 'text', source: any, options: Grid2DOptions) {
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
    //@ts-expect-error (see `xyext` todo)
    super(type, source, channels, xyext);
    this.densityMap = densityMap;

    this.bandwidth = handleParam(bandwidth, value => {
      this.bandwidth = value;
      return this.grids ? this.convolve().update() : null;
    });

    this.interpolate = handleParam(interpolate, value => {
      return (this.interpolate = value, this.requestUpdate());
    });

    this.pixelSize = handleParam(pixelSize, value => {
      return (this.pixelSize = value, this.requestUpdate());
    });

    this.pad = handleParam(pad, value => {
      return (this.pad = value, this.requestUpdate());
    });

    this.width = handleParam(width, value => {
      return (this.width = value, this.requestUpdate());
    });

    this.height = handleParam(height, value => {
      return (this.height = value, this.requestUpdate());
    });
  }

  setPlot(plot: Plot, index: number): void {
    const update = () => { if (this.hasFieldInfo()) this.requestUpdate(); };
    plot.addAttributeListener('xDomain', update);
    plot.addAttributeListener('yDomain', update);
    super.setPlot(plot, index);
  }

  get filterStable(): boolean {
    const xdom = this.plot.getAttribute('xDomain');
    const ydom = this.plot.getAttribute('yDomain');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter: msql.FilterExpr = []): msql.SelectQuery {
    const { interpolate, pad, channels, densityMap } = this;
    filter = [filter].flat();
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


    const groupby: string[] = this.groupby = [];
    const aggrMap: Record<string, ExprNode> = {};
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { as, channel, field } = c;
        //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
        if (isAggregateExpression(field)) {
          // include custom aggregate
          //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
          aggrMap[channel] = field;
          densityMap[channel] = true;
        } else if (channel === 'weight') {
          // compute weighted density
          // @ts-expect-error Type '{ stats?: { stats?: Stat[]; column?: FieldRef; }; basis?: unknown; }' is not assignable to type 'ExprValue'.
          aggrMap[DENSITY] = sum(field);
        } else if (channel !== 'x' && channel !== 'y') {
          // add groupby field
          //@ts-expect-error Type '{ [x: string]: Field; }' is not assignable to type 'string'.
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

  binDimensions(): [number, number] {
    const { plot, pixelSize, width, height } = this;
    return [
      width ?? Math.round(plot.innerWidth() / pixelSize),
      height ?? Math.round(plot.innerHeight() / pixelSize)
    ];
  }

  queryResult(data: unknown): this {
    const [w, h] = this.bins;
    const interp = maybeInterpolate(this.interpolate);
    // @ts-expect-error Correct the data column type
    const { columns } = toDataColumns(data);
    this.grids0 = grid2d(w, h, columns.index, columns, this.aggr, this.groupby, interp);
    return this.convolve();
  }

  convolve(): this {
    const { aggr, bandwidth, bins, grids0, plot } = this;

    // no smoothing as default fallback
    this.grids = grids0;

    if (bandwidth > 0 && grids0.numRows > 0) {
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
      const neg = g.some((grid: any) => grid.some((v: number) => v < 0));
      const configX = dericheConfig(bandwidth * (nx - 1) / w, neg);
      const configY = dericheConfig(bandwidth * (ny - 1) / h, neg);
      this.grids = {
        numRows: grids0.numRows,
        columns: {
          ...grids0.columns,
          // @ts-expect-error array types
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
function createDensityMap(channels: Encodings): Encodings {
  const densityMap: Encodings = {};
  for (const k in channels) {
    const key = k as EncodingName;
    if (channels[key] === 'density') {
      delete channels[key];
      densityMap[key] = true;
    }
  }
  return densityMap;
}

function maybeInterpolate(interpolate: ObPlot.RasterInterpolateFunction | string): ObPlot.RasterInterpolateFunction {
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
