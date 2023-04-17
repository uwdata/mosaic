import { Query, and, count, gt, lt, lte, sum, expr } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { binField } from './util/bin-field.js';
import { dericheConfig, dericheConv2d, grid2d } from './util/density.js';
import { extentX, extentY, xyext } from './util/extent.js';
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
    const densityFill = channels.fill === 'density';
    const densityStroke = channels.stroke === 'density';
    if (densityFill) delete channels.fill;
    if (densityStroke) delete channels.stroke;

    super(type, source, channels, xyext);
    this.densityFill = densityFill;
    this.densityStroke = densityStroke;

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
    const xdom = this.plot.getAttribute('domainX');
    const ydom = this.plot.getAttribute('domainY');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter = []) {
    const { plot, binType, channels, source, stats } = this;

    const q = Query.from(source.table).where(filter);
    const groupby = this.groupby = [];
    let agg = count();
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        const exp = field.transform?.(stats) || field;
        if (exp.aggregate) {
          const keys = exp.columns.map((column, i) => {
            const key = `${channel}${i || ''}`;
            q.select({ [key]: column });
            return key;
          });
          agg = exp.rewrite(keys);
          this.densityFill = true;
        } else {
          q.select({ [channel]: exp });
          if (channel === 'weight') {
            agg = sum(channel);
          } else if (channel !== 'x' && channel !== 'y') {
            groupby.push(channel);
          }
        }
      }
    }

    const [x0, x1] = this.extentX = extentX(this, filter);
    const [y0, y1] = this.extentY = extentY(this, filter);
    const [nx, ny] = this.bins = this.binDimensions(this);

    const bx = binField(this, 'x');
    const by = binField(this, 'y');
    const rx = !!plot.getAttribute('reverseX');
    const ry = !!plot.getAttribute('reverseY');
    const x = bin1d(bx, x0, x1, nx, rx, this.binPad);
    const y = bin1d(by, y0, y1, ny, ry, this.binPad);
    const bounds = and(lte(x0, bx), lt(bx, x1), lte(y0, by), lt(by, y1));

    return binType === 'linear'
      ? binLinear2d(q, x, y, agg, nx, bounds, groupby)
      : bin2d(q, x, y, agg, nx, bounds, groupby);
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

export function bin1d(x, x0, x1, n, reverse = false, pad = 1) {
  return reverse
    ? expr(`(${x1} - ${x}::DOUBLE) * ${(n - pad) / (x1 - x0)}::DOUBLE`)
    : expr(`(${x}::DOUBLE - ${x0}) * ${(n - pad) / (x1 - x0)}::DOUBLE`);
}

function bin2d(input, xp, yp, value, xn, filter, groupby = []) {
  return Query
    .select({
      index: expr(`FLOOR(${xp})::INTEGER + FLOOR(${yp})::INTEGER * ${xn}`),
      value
    }, groupby)
    .from(input)
    .groupby('index', groupby)
    .where(filter);
}

function binLinear2d(input, xp, yp, value, xn, filter, groupby = []) {
  const w = value.column ? `* ${value.column}` : '';

  const q = (i, w) => Query
    .select({ xp, yp, i, w }, groupby)
    .from(input)
    .where(filter);

  // grid[xu + yu * xn] += (xv - xp) * (yv - yp) * wi;
  const a = q(
    expr(`FLOOR(xp)::INTEGER + FLOOR(yp)::INTEGER * ${xn}`),
    expr(`(FLOOR(xp)::INTEGER + 1 - xp) * (FLOOR(yp)::INTEGER + 1 - yp)${w}`)
  );

  // grid[xu + yv * xn] += (xv - xp) * (yp - yu) * wi;
  const b = q(
    expr(`FLOOR(xp)::INTEGER + (FLOOR(yp)::INTEGER + 1) * ${xn}`),
    expr(`(FLOOR(xp)::INTEGER + 1 - xp) * (yp - FLOOR(yp)::INTEGER)${w}`)
  );

  // grid[xv + yu * xn] += (xp - xu) * (yv - yp) * wi;
  const c = q(
    expr(`FLOOR(xp)::INTEGER + 1 + FLOOR(yp)::INTEGER * ${xn}`),
    expr(`(xp - FLOOR(xp)::INTEGER) * (FLOOR(yp)::INTEGER + 1 - yp)${w}`)
  );

  // grid[xv + yv * xn] += (xp - xu) * (yp - yu) * wi;
  const d = q(
    expr(`FLOOR(xp)::INTEGER + 1 + (FLOOR(yp)::INTEGER + 1) * ${xn}`),
    expr(`(xp - FLOOR(xp)::INTEGER) * (yp - FLOOR(yp)::INTEGER)${w}`)
  );

  return Query
    .from(Query.unionAll(a, b, c, d))
    .select({ index: 'i', value: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(gt('value', 0));
}
