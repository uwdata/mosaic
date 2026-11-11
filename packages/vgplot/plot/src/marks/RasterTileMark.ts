import { coordinator } from '@uwdata/mosaic-core';
import { Query, count, isBetween, lt, lte, neq, sql, sum } from '@uwdata/mosaic-sql';
import { binExpr } from './util/bin-expr.js';
import { extentX, extentY } from './util/extent.js';
import { indices, permute } from './util/permute.js';
import { Grid2DMark, type Grid2DOptions } from './Grid2DMark.js';
import { imageData, rasterEncoding, Image } from './RasterMark.js';
import type { Plot } from '../plot.js';
import type * as msql from '@uwdata/mosaic-sql';
import type { PlotMarkSpec } from './Mark.js';
import type { Table } from '@uwdata/flechette';

type RasterTileOptions = Grid2DOptions & { origin?: [number, number]; dim?: 'x' | 'y' | 'xy'; };

export class RasterTileMark extends Grid2DMark {
  image: Image | null;
  origin: [number, number];
  tileX: boolean;
  tileY: boolean;
  _filter: msql.FilterExpr;
  prefetch: any;
  constructor(source: any, options: RasterTileOptions) {
    const { origin = [0, 0], dim = 'xy', ...markOptions } = options;
    super('image', source, markOptions);
    this.image = null;

    // TODO: make part of data source instead of options?
    this.origin = origin;
    this.tileX = dim.toLowerCase().includes('x');
    this.tileY = dim.toLowerCase().includes('y');
  }

  setPlot(plot: Plot, index: number): void {
    const update = () => { if (this.hasFieldInfo()) this.rasterize(); };
    // @ts-expect-error 'schemeColor' is not defined in the spec?
    plot.addAttributeListener('schemeColor', update);
    super.setPlot(plot, index);
  }

  requestQuery(): Promise<void> {
    return this.requestTiles();
  }

  query(filter: msql.FilterExpr = []): null {
    this._filter = filter;
    // we will submit our own queries
    return null;
  }

  tileQuery(extent: number[][]) {
    const { interpolate, pad, channels, densityMap } = this;
    const [[x0, x1], [y0, y1]] = extent;
    const [nx, ny] = this.bins;
    const [x, bx] = binExpr(this, 'x', nx, [x0, x1], pad);
    const [y, by] = binExpr(this, 'y', ny, [y0, y1], pad);

    // with padded bins, include the entire domain extent
    // if the bins are flush, exclude the extent max
    const bounds = pad
      ? [isBetween(bx, [+x0, +x1]), isBetween(by, [+y0, +y1])]
      : [lte(+x0, bx), lt(bx, +x1), lte(+y0, by), lt(by, +y1)];

    const q = Query
      .from(this.sourceTable())
      .where(bounds);

    const groupby: string[] = this.groupby = [];
    const aggrMap: Record<string, msql.ExprNode> = {};
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { as, channel, field } = c;
        //@ts-expect-error Property 'aggregate' does not exist on type 'string'
        if (field.aggregate) {
          // include custom aggregate
          //@ts-expect-error Type 'string' is not assignable to type 'SQLNode'.
          aggrMap[channel] = field;
          densityMap[channel] = true;
        } else if (channel === 'weight') {
          // compute weighted density
          // @ts-expect-error Type '{ stats?: { stats?: Stat[]; column?: FieldRef; }; basis?: unknown; }' is not assignable to type 'ExprValue'.
          aggrMap.density = sum(field);
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
      aggr.push('density');
      aggrMap.density = count();
    }

    // generate grid binning query
    if (interpolate === 'linear') {
      if (aggr.length > 1) {
        throw new Error('Linear binning not applicable to multiple aggregates.');
      }
      if (!aggrMap.density) {
        throw new Error('Linear binning not applicable to custom aggregates.');
      }
      return binLinear2d(q, x, y, aggrMap.density, nx, groupby);
    } else {
      return bin2d(q, x, y, aggrMap, nx, groupby);
    }
  }

  async requestTiles(): Promise<void> {
    // get coordinator, cancel prior prefetch queries
    const mc = coordinator();
    if (this.prefetch) mc.cancel(this.prefetch);

    // get view extent info
    const { pad, tileX, tileY, origin: [tx, ty] } = this;
    const [m, n] = this.bins = this.binDimensions();
    const [x0, x1] = extentX(this, this._filter);
    const [y0, y1] = extentY(this, this._filter);
    const xspan = x1 - x0;
    const yspan = y1 - y0;
    const xx = Math.floor((x0 - tx) * (m - pad) / xspan);
    const yy = Math.floor((y0 - ty) * (n - pad) / yspan);

    const tileExtent = (i: number, j: number) => [
      [tx + i * xspan, tx + (i + 1) * xspan],
      [ty + j * yspan, ty + (j + 1) * yspan]
    ];

    // get tile coords that overlap current view extent
    const i0 = Math.floor((x0 - tx) / xspan);
    const i1 = tileX ? tileFloor((x1 - tx) / xspan) : i0;
    const j0 = Math.floor((y0 - ty) / yspan);
    const j1 = tileY ? tileFloor((y1 - ty) / yspan) : j0;

    // query for currently needed data tiles
    const coords: number[][] = [];
    for (let i = i0; i <= i1; ++i) {
      for (let j = j0; j <= j1; ++j) {
        coords.push([i, j]);
      }
    }
    const queries = coords.map(
      ([i, j]) => mc.query(this.tileQuery(tileExtent(i, j)))
    );

    // prefetch tiles along periphery of current tiles
    const prefetchCoords = [];
    if (tileX) {
      for (let j = j0; j <= j1; ++j) {
        prefetchCoords.push([i1 + 1, j]);
        prefetchCoords.push([i0 - 1, j]);
      }
    }
    if (tileY) {
      const x0 = tileX ? i0 - 1 : i0;
      const x1 = tileX ? i1 + 1 : i1;
      for (let i = x0; i <= x1; ++i) {
        prefetchCoords.push([i, j1 + 1]);
        prefetchCoords.push([i, j0 - 1]);
      }
    }
    this.prefetch = prefetchCoords.map(
      ([i, j]) => mc.prefetch(this.tileQuery(tileExtent(i, j)))
    );

    // wait for tile queries to complete, then update
    const tiles = await Promise.all(queries);
    const density = processTiles(m, n, xx, yy, coords, tiles);
    this.grids0 = {
      numRows: density.length,
      columns: { density: [density] }
    };
    this.convolve().update();
  }

  convolve(): this {
    return super.convolve().rasterize();
  }

  rasterize(): this {
    const { bins, grids } = this;
    const [w, h] = bins;
    const { numRows, columns } = grids;

    // raster data
    const { canvas, ctx, img } = imageData(this, w, h);

    // color + opacity encodings
    const { alpha, alphaProp, color, colorProp } = rasterEncoding(this);
    const alphaData = columns[alphaProp] ?? [];
    const colorData = columns[colorProp] ?? [];

    // determine raster order
    const idx = numRows > 1 && colorProp && this.groupby?.includes(colorProp)
      ? permute(colorData, this.plot.getAttribute('colorDomain'))
      : indices(numRows);

    // generate rasters
    this.data = {
      numRows,
      columns: {
        src: Array.from({ length: numRows }, (_, i) => {
          color?.(img.data, w, h, colorData[idx[i]]);
          alpha?.(img.data, w, h, alphaData[idx[i]]);
          ctx.putImageData(img, 0, 0);
          return canvas.toDataURL();
        })
      }
    };

    return this;
  }

  plotSpecs(): PlotMarkSpec[] {
    // @ts-expect-error Correct the data column type
    const { type, plot, data: { numRows: length, columns } } = this;
    const options = {
      src: columns.src,
      width: plot.innerWidth(),
      height: plot.innerHeight(),
      preserveAspectRatio: 'none',
      //@ts-expect-error Argument of type '"imageRendering"' is not assignable to parameter of type 'ChannelName'.
      imageRendering: this.channel('imageRendering')?.value,
      frameAnchor: 'middle'
    };
    return [{ type, data: { length }, options }];
  }
}

function processTiles(m: number, n: number, x: number, y: number, coords: number[][], tiles: Table[]): Float64Array<ArrayBuffer> {
  const grid = new Float64Array(m * n);
  tiles.forEach((data, index) => {
    const [i, j] = coords[index];
    const tx = i * m - x;
    const ty = j * n - y;
    copy(m, n, grid, data, tx, ty);
  });
  return grid;
}

function copy(m: number, n: number, grid: Float64Array<ArrayBuffer>, values: Table, tx: number, ty: number): void {
  // index = row + col * width
  const num = values.numRows;
  if (num === 0) return;
  const index = values.getChild('index').toArray();
  const value = values.getChild('density').toArray();
  for (let row = 0; row < num; ++row) {
    const idx = index[row];
    const i = tx + (idx % m);
    const j = ty + Math.floor(idx / m);
    if (0 <= i && i < m && 0 <= j && j < n) {
      grid[i + j * m] = value[row];
    }
  }
}

function bin2d(q: msql.SelectQuery, xp: msql.ExprValue, yp: msql.ExprValue, aggs: Record<string, msql.ExprNode>, xn: number, groupby: string[]): msql.SelectQuery {
  return q
    .select({
      index: sql`FLOOR(${xp})::INTEGER + FLOOR(${yp})::INTEGER * ${xn}`,
      ...aggs
    })
    .groupby('index', groupby);
}

function binLinear2d(q: msql.SelectQuery, xp: msql.ExprValue, yp: msql.ExprValue, value: msql.ExprNode, xn: number, groupby: string[]): msql.SelectQuery {
  //@ts-expect-error Property 'column' does not exist on type 'ExprNode'.
  const w = value.column ? `* ${value.column}` : '';
  const subq = (i, w) => q.clone().select({ xp, yp, i, w });

  // grid[xu + yu * xn] += (xv - xp) * (yv - yp) * wi;
  const a = subq(
    sql`FLOOR(xp)::INTEGER + FLOOR(yp)::INTEGER * ${xn}`,
    sql`(FLOOR(xp)::INTEGER + 1 - xp) * (FLOOR(yp)::INTEGER + 1 - yp)${w}`
  );

  // grid[xu + yv * xn] += (xv - xp) * (yp - yu) * wi;
  const b = subq(
    sql`FLOOR(xp)::INTEGER + (FLOOR(yp)::INTEGER + 1) * ${xn}`,
    sql`(FLOOR(xp)::INTEGER + 1 - xp) * (yp - FLOOR(yp)::INTEGER)${w}`
  );

  // grid[xv + yu * xn] += (xp - xu) * (yv - yp) * wi;
  const c = subq(
    sql`FLOOR(xp)::INTEGER + 1 + FLOOR(yp)::INTEGER * ${xn}`,
    sql`(xp - FLOOR(xp)::INTEGER) * (FLOOR(yp)::INTEGER + 1 - yp)${w}`
  );

  // grid[xv + yv * xn] += (xp - xu) * (yp - yu) * wi;
  const d = subq(
    sql`FLOOR(xp)::INTEGER + 1 + (FLOOR(yp)::INTEGER + 1) * ${xn}`,
    sql`(xp - FLOOR(xp)::INTEGER) * (yp - FLOOR(yp)::INTEGER)${w}`
  );

  return Query
    .from(Query.unionAll(a, b, c, d))
    .select({ index: 'i', density: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(neq('density', 0));
}

function tileFloor(value: number): number {
  const floored = Math.floor(value);
  return floored === value ? floored - 1 : floored;
}