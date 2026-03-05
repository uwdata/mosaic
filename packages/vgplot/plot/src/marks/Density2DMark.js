import { channelScale } from './util/channel-scale.js';
import { Grid2DMark } from './Grid2DMark.js';
import { channelOption } from './Mark.js';

export class Density2DMark extends Grid2DMark {
  constructor(source, options) {
    const { type = 'dot', ...channels } = options;
    super(type, source, {
      bandwidth: 20,
      interpolate: 'linear',
      pad: 0,
      pixelSize: 2,
      ...channels
    });
  }

  convolve() {
    super.convolve();
    const { bins, pad, extentX, extentY } = this;
    const [nx, ny] = bins;
    const scaleX = channelScale(this, 'x');
    const scaleY = channelScale(this, 'y');
    const [x0, x1] = extentX.map(v => scaleX.apply(v));
    const [y0, y1] = extentY.map(v => scaleY.apply(v));
    const deltaX = (x1 - x0) / (nx - pad);
    const deltaY = (y1 - y0) / (ny - pad);
    const offset = pad ? 0 : 0.5;
    this.data = points(
      this.grids, bins, x0, y0, deltaX, deltaY,
      scaleX.invert, scaleY.invert, offset
    );
    return this;
  }

  plotSpecs() {
    // @ts-expect-error Correct the data column type
    const { type, channels, densityMap, data: { numRows: length, columns } } = this;
    const options = {};
    for (const c of channels) {
      const { channel } = c;
      options[channel] = (channel === 'x' || channel === 'y')
        ? columns[channel] // use generated x/y data fields
        : channelOption(c, columns);
    }
    for (const channel in densityMap) {
      if (densityMap[channel]) {
        options[channel] = columns.density;
      }
    }
    return [{ type, data: { length }, options }];
  }
}

function points(data, bins, x0, y0, deltaX, deltaY, invertX, invertY, offset) {
  const scale = 1 / (deltaX * deltaY);
  const [nx, ny] = bins;
  const batch = nx * ny;
  const numRows = batch * data.numRows;

  const x = new Float64Array(numRows);
  const y = new Float64Array(numRows);
  const density = new Float64Array(numRows);
  const columns = { x, y, density };
  const { density: grids, ...rest } = data.columns;
  for (const name in rest) {
    columns[name] = new rest[name].constructor(numRows);
  }

  let r = 0;
  for (let row = 0; row < data.numRows; ++row) {
    // copy repeated values in batch
    for (const name in rest) {
      columns[name].fill(rest[name][row], r, r + batch);
    }
    // copy individual grid values
    const grid = grids[row];
    for (let k = 0, j = 0; j < ny; ++j) {
      for (let i = 0; i < nx; ++i, ++r, ++k) {
        x[r] = invertX(x0 + (i + offset) * deltaX);
        y[r] = invertY(y0 + (j + offset) * deltaY);
        density[r] = grid[k] * scale;
      }
    }
  }

  return { numRows, columns };
}
