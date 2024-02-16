import { Query, count, gt, isBetween, lt, lte, sql, sum } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binField } from './util/bin-field.js';
import { dericheConfig, dericheConv2d } from './util/density.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { grid2d } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Mark } from './Mark.js';

export class Grid2DMark extends Mark {
  constructor(type, source, options) {
    const {
      bandwidth = 20,
      binType = 'linear',
      binWidth = 2,
      binPad = 1,
      ...channels
    } = options;

    const densityMap = createDensityMap(channels);
    super(type, source, channels, xyext);
    this.densityMap = densityMap;

    handleParam(this, 'bandwidth', bandwidth, () => {
      return this.grids ? this.convolve().update() : null;
    });
    handleParam(this, 'binWidth', binWidth);
    handleParam(this, 'binType', binType);
    handleParam(this, 'binPad', binPad);
  }

  setPlot(plot, index) {
    const update = () => { if (this.stats) this.requestUpdate(); };
    plot.addAttributeListener('domainX', update);
    plot.addAttributeListener('domainY', update);
    return super.setPlot(plot, index);
  }

  get filterIndexable() {
    const xdom = this.plot.getAttribute('xDomain');
    const ydom = this.plot.getAttribute('yDomain');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter = []) {
    const { plot, binType, binPad, channels, densityMap, source } = this;
    const [x0, x1] = this.extentX = extentX(this, filter);
    const [y0, y1] = this.extentY = extentY(this, filter);
    const [nx, ny] = this.bins = this.binDimensions(this);
    const bx = binField(this, 'x');
    const by = binField(this, 'y');
    const rx = !!plot.getAttribute('xReverse');
    const ry = !!plot.getAttribute('yReverse');
    const x = bin1d(bx, x0, x1, nx, rx, this.binPad);
    const y = bin1d(by, y0, y1, ny, ry, this.binPad);

    // with padded bins, include the entire domain extent
    // if the bins are flush, exclude the extent max
    const bounds = binPad
      ? [isBetween(bx, [x0, x1]), isBetween(by, [y0, y1])]
      : [lte(x0, bx), lt(bx, x1), lte(y0, by), lt(by, y1)];

    const q = Query
      .from(source.table)
      .where(filter.concat(bounds));

    const groupby = this.groupby = [];
    let agg = count();
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { as, channel, field } = c;
        if (field.aggregate) {
          agg = field;
          densityMap[channel] = true;
        } else if (channel === 'weight') {
          agg = sum(field);
        } else if (channel !== 'x' && channel !== 'y') {
          q.select({ [as]: field });
          groupby.push(as);
        }
      }
    }

    return binType === 'linear'
      ? binLinear2d(q, x, y, agg, nx, groupby)
      : bin2d(q, x, y, agg, nx, groupby);
  }

  binDimensions() {
    const { plot, binWidth } = this;
    return [
      Math.round(plot.innerWidth() / binWidth),
      Math.round(plot.innerHeight() / binWidth)
    ];
  }

  queryResult(data) {
    const [nx, ny] = this.bins;
    this.grids = grid2d(nx, ny, data, this.groupby);
    return this.convolve();
  }

  convolve() {
    const { bandwidth, bins, grids, plot } = this;

    if (bandwidth <= 0) {
      this.kde = this.grids.map(({ key, grid }) => {
        return (grid.key = key, grid);
      });
    } else {
      const w = plot.innerWidth();
      const h = plot.innerHeight();
      const [nx, ny] = bins;
      const neg = grids.some(({ grid }) => grid.some(v => v < 0));
      const configX = dericheConfig(bandwidth * (nx - 1) / w, neg);
      const configY = dericheConfig(bandwidth * (ny - 1) / h, neg);
      this.kde = this.grids.map(({ key, grid }) => {
        const k = dericheConv2d(configX, configY, grid, bins);
        return (k.key = key, k);
      });
    }
    return this;
  }

  plotSpecs() {
    throw new Error('Unimplemented. Use a Grid2D mark subclass.');
  }
}

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
    .having(gt('value', 0));
}
