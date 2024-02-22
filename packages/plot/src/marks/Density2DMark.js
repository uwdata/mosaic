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
      this.kde, bins, x0, y0, deltaX, deltaY,
      scaleX.invert, scaleY.invert, offset
    );
    return this;
  }

  plotSpecs() {
    const { type, channels, densityMap, data } = this;
    const options = {};
    for (const c of channels) {
      const { channel } = c;
      options[channel] = (channel === 'x' || channel === 'y')
        ? channel // use generated x/y data fields
        : channelOption(c);
    }
    for (const channel in densityMap) {
      if (densityMap[channel]) {
        options[channel] = 'density';
      }
    }
    return [{ type, data, options }];
  }
}

function points(kde, bins, x0, y0, deltaX, deltaY, invertX, invertY, offset) {
  const scale = 1 / (deltaX * deltaY);
  const [nx, ny] = bins;
  const data = [];
  for (const cell of kde) {
    const grid = cell.density;
    for (let k = 0, j = 0; j < ny; ++j) {
      for (let i = 0; i < nx; ++i, ++k) {
        data.push({
          ...cell,
          x: invertX(x0 + (i + offset) * deltaX),
          y: invertY(y0 + (j + offset) * deltaY),
          density: grid[k] * scale
        });
      }
    }
  }
  return data;
}
