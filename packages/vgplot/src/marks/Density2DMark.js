import { Grid2DMark } from './Grid2DMark.js';
import { handleParam } from './util/handle-param.js';

export class Density2DMark extends Grid2DMark {
  constructor(type, source, options) {
    const { binsX, binsY, ...channels } = options;
    super(type, source, channels);
    handleParam(this, 'binsX', binsX);
    handleParam(this, 'binsY', binsY);
  }

  convolve() {
    super.convolve();
    const { bins, extentX, extentY } = this;
    const [nx, ny] = bins;
    const deltaX = (extentX[1] - extentX[0]) / (nx - 1);
    const deltaY = (extentY[1] - extentY[0]) / (ny - 1);
    this.data = points(this.kde, bins, extentX[0], extentY[0], deltaX, deltaY);
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
    const { type, channels, densityFill, densityStroke, data } = this;
    const options = {};
    for (const c of channels) {
      options[c.channel] = Object.hasOwn(c, 'value') ? c.value : c.channel;
    }
    if (densityFill) options.fill = 'density';
    if (densityStroke) options.stroke = 'density';
    return [{ type, data, options }];
  }
}

function points(kde, bins, x0, y0, deltaX, deltaY) {
  const scale = 1 / (deltaX * deltaY);
  const [bx, by] = bins;
  const data = [];
  for (const grid of kde) {
    for (let k = 0, j = 0; j < by; ++j) {
      for (let i = 0; i < bx; ++i, ++k) {
        data.push({
          x: x0 + i * deltaX,
          y: y0 + j * deltaY,
          density: grid[k] * scale
        });
      }
    }
  }
  return data;
}
