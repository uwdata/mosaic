import { coordinator } from '@uwdata/mosaic-core';
import { Query, count, isBetween, lt, lte, neq, sql, sum } from '@uwdata/mosaic-sql';
import { scale } from '@observablehq/plot';
import { extentX, extentY } from './util/extent.js';
import { isColor } from './util/is-color.js';
import { createCanvas, raster, opacityMap, palette } from './util/raster.js';
import { Grid2DMark } from './Grid2DMark.js';
import { binField } from './util/bin-field.js';

export class RasterTileMark extends Grid2DMark {
  constructor(source, options) {
    const { origin = [0, 0], dim = 'xy', ...markOptions } = options;
    super('image', source, markOptions);

    // TODO: make part of data source instead of options?
    this.origin = origin;
    this.tileX = dim.toLowerCase().includes('x');
    this.tileY = dim.toLowerCase().includes('y');
  }

  setPlot(plot, index) {
    const update = () => { if (this.stats) this.rasterize(); };
    plot.addAttributeListener('schemeColor', update);
    super.setPlot(plot, index);
  }

  requestQuery() {
    return this.requestTiles();
  }

  query(filter = []) {
    this._filter = filter;
    // we will submit our own queries
    return null;
  }

  tileQuery(extent) {
    const { plot, binType, binPad, channels, densityMap, source } = this;
    const [[x0, x1], [y0, y1]] = extent;
    const [nx, ny] = this.bins;
    const bx = binField(this, 'x');
    const by = binField(this, 'y');
    const rx = !!plot.getAttribute('xReverse');
    const ry = !!plot.getAttribute('yReverse');
    const x = bin1d(bx, x0, x1, nx, rx, binPad);
    const y = bin1d(by, y0, y1, ny, ry, binPad);

    // with padded bins, include the entire domain extent
    // if the bins are flush, exclude the extent max
    const bounds = binPad
      ? [isBetween(bx, [x0, x1]), isBetween(by, [y0, y1])]
      : [lte(x0, bx), lt(bx, x1), lte(y0, by), lt(by, y1)];

    const q = Query
      .from(source.table)
      .where(bounds);

    const groupby = this.groupby = [];
    let agg = count();
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        if (field.aggregate) {
          agg = field;
          densityMap[channel] = true;
        } else if (channel === 'weight') {
          agg = sum(field);
        } else if (channel !== 'x' && channel !== 'y') {
          q.select({ [channel]: field });
          groupby.push(channel);
        }
      }
    }

    return binType === 'linear'
      ? binLinear2d(q, x, y, agg, nx, groupby)
      : bin2d(q, x, y, agg, nx, groupby);
  }

  async requestTiles() {
    // get coordinator, cancel prior prefetch queries
    const mc = coordinator();
    if (this.prefetch) mc.cancel(this.prefetch);

    // get view extent info
    const { binPad, tileX, tileY, origin: [tx, ty] } = this;
    const [m, n] = this.bins = this.binDimensions(this);
    const [x0, x1] = extentX(this, this._filter);
    const [y0, y1] = extentY(this, this._filter);
    const xspan = x1 - x0;
    const yspan = y1 - y0;
    const xx = Math.floor((x0 - tx) * (m - binPad) / xspan);
    const yy = Math.floor((y0 - ty) * (n - binPad) / yspan);

    const tileExtent = (i, j) => [
      [tx + i * xspan, tx + (i + 1) * xspan],
      [ty + j * yspan, ty + (j + 1) * yspan]
    ];

    // get tile coords that overlap current view extent
    const i0 = Math.floor((x0 - tx) / xspan);
    const i1 = tileX ? tileFloor((x1 - tx) / xspan) : i0;
    const j0 = Math.floor((y0 - ty) / yspan);
    const j1 = tileY ? tileFloor((y1 - ty) / yspan) : j0;

    // query for currently needed data tiles
    const coords = [];
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
    this.grids = [{ grid: processTiles(m, n, xx, yy, coords, tiles) }];
    this.convolve().update();
  }

  convolve() {
    return super.convolve().rasterize();
  }

  rasterize() {
    const { bins, kde, groupby } = this;
    const [ w, h ] = bins;

    // raster data
    const { canvas, ctx, img } = imageData(this, w, h);

    // scale function to map densities to [0, 1]
    const s = imageScale(this);

    // gather color domain as needed
    const idx = groupby.indexOf(this.channelField('fill')?.as);
    const domain = idx < 0 ? [] : kde.map(({ key }) => key[idx]);

    // generate raster images
    this.data = kde.map(grid => {
      const palette = imagePalette(this, domain, grid.key?.[idx]);
      raster(grid, img.data, w, h, s, palette);
      ctx.putImageData(img, 0, 0);
      return { src: canvas.toDataURL() };
    });

    return this;
  }

  plotSpecs() {
    const { type, data, plot } = this;
    const options = {
      src: 'src',
      width: plot.innerWidth(),
      height: plot.innerHeight(),
      preserveAspectRatio: 'none',
      imageRendering: this.channel('imageRendering')?.value,
      frameAnchor: 'middle'
    };
    return [{ type, data, options }];
  }
}

function processTiles(m, n, x, y, coords, tiles) {
  const grid = new Float64Array(m * n);
  tiles.forEach((data, index) => {
    const [i, j] = coords[index];
    const tx = i * m - x;
    const ty = j * n - y;
    copy(m, n, grid, data, tx, ty);
  });
  return grid;
}

function copy(m, n, grid, values, tx, ty) {
  // index = row + col * width
  const num = values.numRows;
  if (num === 0) return;
  const index = values.getChild('index').toArray();
  const value = values.getChild('value').toArray();
  for (let row = 0; row < num; ++row) {
    const idx = index[row];
    const i = tx + (idx % m);
    const j = ty + Math.floor(idx / m);
    if (0 <= i && i < m && 0 <= j && j < n) {
      grid[i + j * m] = value[row];
    }
  }
}

function imageData(mark, w, h) {
  if (!mark.image || mark.image.w !== w || mark.image.h !== h) {
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, w, h);
    mark.image = { canvas, ctx, img, w, h };
  }
  return mark.image;
}

function imageScale(mark) {
  const { densityMap, kde, plot } = mark;
  let domain = densityMap.fill && plot.getAttribute('colorDomain');

  // compute kde grid extents if no explicit domain
  if (!domain) {
    let lo = 0, hi = 0;
    kde.forEach(grid => {
      for (const v of grid) {
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    });
    domain = (lo === 0 && hi === 0) ? [0, 1] : [lo, hi];
  }

  const type = plot.getAttribute('colorScale');
  return scale({ x: { type, domain, range: [0, 1] } }).apply;
}

function imagePalette(mark, domain, value, steps = 1024) {
  const { densityMap, plot } = mark;
  const scheme = plot.getAttribute('colorScheme');
  let color;

  if (densityMap.fill) {
    if (scheme) {
      try {
        return palette(
          steps,
          scale({color: { scheme, domain: [0, 1] }}).interpolate
        );
      } catch (err) {
        console.warn(err);
      }
    }
  } else if (domain.length) {
    // fill is based on data values
    const range = plot.getAttribute('colorRange');
    const spec = {
      domain,
      range,
      scheme: scheme || (range ? undefined : 'tableau10')
    };
    color = scale({ color: spec }).apply(value);
  } else {
    // fill color is a constant
    const fill = mark.channelField('fill');
    color = isColor(fill?.value) ? fill.value : undefined;
  }

  return palette(steps, opacityMap(color));
}

function bin1d(x, x0, x1, n, reverse, pad) {
  const d = (n - pad) / (x1 - x0);
  const f = d !== 1 ? ` * ${d}::DOUBLE` : '';
  return reverse
    ? sql`(${x1} - ${x}::DOUBLE)${f}`
    : sql`(${x}::DOUBLE - ${x0})${f}`;
}

function bin2d(q, xp, yp, value, xn, groupby) {
  return q
    .select({
      index: sql`FLOOR(${xp})::INTEGER + FLOOR(${yp})::INTEGER * ${xn}`,
      value
    })
    .groupby('index', groupby);
}

function binLinear2d(q, xp, yp, value, xn, groupby) {
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
    .select({ index: 'i', value: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(neq('value', 0));
}

function tileFloor(value) {
  const floored = Math.floor(value);
  return floored === value ? floored - 1 : floored;
}