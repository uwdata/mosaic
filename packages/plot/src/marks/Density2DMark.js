import { handleParam } from './util/handle-param.js';
import { Grid2DMark } from './Grid2DMark.js';
import { channelOption } from './Mark.js';

export class Density2DMark extends Grid2DMark {
  constructor(source, options) {
    const { type = 'dot', binsX, binsY, ...channels } = options;
    channels.binPad = channels.binPad ?? 0;
    super(type, source, channels);
    handleParam(this, 'binsX', binsX);
    handleParam(this, 'binsY', binsY);
  }

  convolve() {
    super.convolve();
    const { bins, binPad, extentX, extentY } = this;
    const [nx, ny] = bins;
    const [x0, x1] = extentX;
    const [y0, y1] = extentY;
    const deltaX = (x1 - x0) / (nx - binPad);
    const deltaY = (y1 - y0) / (ny - binPad);
    const offset = binPad ? 0 : 0.5;
    this.data = points(this.kde, bins, x0, y0, deltaX, deltaY, offset);
    return this;
  }

  binDimensions() {
    const { plot, binWidth, binsX, binsY } = this;
    return [
      binsX ?? Math.round(plot.innerWidth() / binWidth),
      binsY ?? Math.round(plot.innerHeight() / binWidth)
    ];
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

function points(kde, bins, x0, y0, deltaX, deltaY, offset) {
  const scale = 1 / (deltaX * deltaY);
  const [nx, ny] = bins;
  const data = [];
  for (const grid of kde) {
    for (let k = 0, j = 0; j < ny; ++j) {
      for (let i = 0; i < nx; ++i, ++k) {
        data.push({
          x: x0 + (i + offset) * deltaX,
          y: y0 + (j + offset) * deltaY,
          density: grid[k] * scale
        });
      }
    }
  }
  return data;
}
