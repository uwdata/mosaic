import { isParam } from '@uwdata/mosaic-core';
import { Query, and, gt, sum, expr, isBetween } from '@uwdata/mosaic-sql';
import { Transient } from '../symbols.js';
import { dericheConfig, dericheConv2d, grid2d } from './util/density.js';
import { extentX, extentY, xyext } from './util/extent.js';
import { Mark } from './Mark.js';

export class Density2DMark extends Mark {
  constructor(type, source, options) {
    const { bandwidth = 20, binWidth = 2, ...channels } = options;
    const densityFill = channels.fill === 'density';
    const densityStroke = channels.stroke === 'density';
    if (densityFill) delete channels.fill;
    if (densityStroke) delete channels.stroke;

    super(type, source, channels, xyext);
    this.densityFill = densityFill;
    this.densityStroke = densityStroke;
    this.bandwidth = bandwidth;
    this.binWidth = binWidth;

    if (isParam(bandwidth)) {
      bandwidth.addEventListener('value', value => {
        this.bandwidth = value;
        if (this.grids) this.convolve().update();
      });
      this.bandwidth = bandwidth.value;
    }

    if (isParam(binWidth)) {
      binWidth.addEventListener('value', value => {
        this.binWidth = value;
        this.requestUpdate();
      });
      this.binWidth = binWidth.value;
    }
  }

  get filterIndexable() {
    const xdom = this.plot.getAttribute('domainX');
    const ydom = this.plot.getAttribute('domainY');
    return xdom && ydom && !xdom[Transient] && !ydom[Transient];
  }

  query(filter = []) {
    const { plot, channels, source, stats } = this;

    const q = Query.from(source.table).where(filter);
    const groupby = this.groupby = [];
    let w = 1;
    for (const c of channels) {
      if (Object.hasOwn(c, 'field')) {
        const { channel, field } = c;
        const expr = field.transform?.(stats) || field;
        q.select({ [channel]: expr });
        if (channel === 'weight') {
          w = channel;
        } else if (channel !== 'x' && channel !== 'y') {
          groupby.push(channel);
        }
      }
    }

    const [x0, x1] = extentX(this, filter);
    const [y0, y1] = extentY(this, filter);
    const [nx, ny] = this.bins = [
      Math.round(plot.innerWidth() / this.binWidth),
      Math.round(plot.innerHeight() / this.binWidth)
    ];
    const rx = !!plot.getAttribute('reverseX');
    const ry = !!plot.getAttribute('reverseY');
    return binLinear2d(q, 'x', 'y', w, x0, x1, y0, y1, nx, ny, rx, ry, groupby);
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
    throw new Error('Unimplemented. Use a Density2D mark subclass.');
  }
}

function binLinear2d(input, x, y, weight, x0, x1, y0, y1, xn, yn, rx, ry, groupby = []) {
  const w = weight && weight !== 1 ? `* ${weight}` : '';
  const xp = rx
    ? expr(`(${x1} - ${x}) * ${(xn - 1) / (x1 - x0)}::DOUBLE`)
    : expr(`(${x} - ${x0}) * ${(xn - 1) / (x1 - x0)}::DOUBLE`);
  const yp = ry
    ? expr(`(${y1} - ${y}) * ${(yn - 1) / (y1 - y0)}::DOUBLE`)
    : expr(`(${y} - ${y0}) * ${(yn - 1) / (y1 - y0)}::DOUBLE`);

  const q = (i, w) => Query
    .select({ xp, yp, i, w }, groupby)
    .from(input)
    .where(and(
      isBetween(x, [x0, x1]),
      isBetween(y, [y0, y1])
    ));

  // grid[xu + yu * xn] += (xv - xp) * (yv - yp) * wi;
  const a = q(
    expr(`FLOOR(xp) + FLOOR(yp) * ${xn}`),
    expr(`(FLOOR(xp) + 1 - xp) * (FLOOR(yp) + 1 - yp)${w}`)
  );

  // grid[xu + yv * xn] += (xv - xp) * (yp - yu) * wi;
  const b = q(
    expr(`FLOOR(xp) + (FLOOR(yp) + 1) * ${xn}`),
    expr(`(FLOOR(xp) + 1 - xp) * (yp - FLOOR(yp))${w}`)
  );

  // grid[xv + yu * xn] += (xp - xu) * (yv - yp) * wi;
  const c = q(
    expr(`FLOOR(xp) + 1 + FLOOR(yp) * ${xn}`),
    expr(`(xp - FLOOR(xp)) * (FLOOR(yp) + 1 - yp)${w}`)
  );

  // grid[xv + yv * xn] += (xp - xu) * (yp - yu) * wi;
  const d = q(
    expr(`FLOOR(xp) + 1 + (FLOOR(yp) + 1) * ${xn}`),
    expr(`(xp - FLOOR(xp)) * (yp - FLOOR(yp))${w}`)
  );

  return Query
    .from(Query.unionAll(a, b, c, d))
    .select({ index: 'i', weight: sum('w') }, groupby)
    .groupby('index', groupby)
    .having(gt('weight', 0));
}

// code snippets for plotting density bins directly
// const deltaX = (extentX[1] - extentX[0]) / (nx - 1);
// const deltaY = (extentY[1] - extentY[0]) / (ny - 1);
// this.data = points(kde, bins, extentX[0], extentY[0], deltaX, deltaY);

// function points(kde, bins, x0, y0, deltaX, deltaY) {
//   const scale = 1 / (deltaX * deltaY);
//   const [bx, by] = bins;
//   const data = [];
//   for (let k = 0, j = 0; j < by; ++j) {
//     for (let i = 0; i < bx; ++i, ++k) {
//       data.push({
//         x: x0 + i * deltaX,
//         y: y0 + j * deltaY,
//         density: kde[k] * scale
//       });
//     }
//   }
//   return data;
// }
