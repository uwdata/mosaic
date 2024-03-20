import { contours } from 'd3';
import { gridDomainContinuous } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Grid2DMark } from './Grid2DMark.js';
import { channelOption } from './Mark.js';

export class ContourMark extends Grid2DMark {
  constructor(source, options) {
    const { thresholds = 10, ...channels } = options;
    super('geo', source, {
      bandwidth: 20,
      interpolate: 'linear',
      pixelSize: 2,
      ...channels
    });
    handleParam(this, 'thresholds', thresholds, () => {
      return this.grids ? this.contours().update() : null
    });
  }

  convolve() {
    return super.convolve().contours();
  }

  contours() {
    const { bins, densityMap, kde, thresholds, plot } = this;

    let tz = thresholds;
    if (!Array.isArray(tz)) {
      const [, hi] = gridDomainContinuous(kde, 'density');
      tz = Array.from({length: tz - 1}, (_, i) => (hi * (i + 1)) / tz);
    }

    if (densityMap.fill || densityMap.stroke) {
      if (this.plot.getAttribute('colorScale') !== 'log') {
        this.plot.setAttribute('colorZero', true);
      }
    }

    // transform contours into data space coordinates
    // so we play nice with scale domains & axes
    const [nx, ny] = bins;
    const [x0, x1] = plot.getAttribute('xDomain');
    const [y0, y1] = plot.getAttribute('yDomain');
    const sx = (x1 - x0) / nx;
    const sy = (y1 - y0) / ny;
    const xo = +x0;
    const yo = +y0;
    const x = v => xo + v * sx;
    const y = v => yo + v * sy;
    const contour = contours().size(bins);

    // generate contours
    this.data = kde.flatMap(cell => tz.map(t => {
      // annotate contour geojson with cell groupby fields
      // d3-contour already adds a threshold "value" property
      const { density, ...groupby } = cell;
      return Object.assign(
        transform(contour.contour(density, t), x, y),
        { ...groupby }
      );
    }));

    return this;
  }

  plotSpecs() {
    const { type, channels, densityMap, data } = this;
    const options = {};
    for (const c of channels) {
      const { channel } = c;
      if (channel !== 'x' && channel !== 'y') {
        options[channel] = channelOption(c);
      }
    }
    // d3-contour adds a threshold "value" property
    // here we ensure requested density values are encoded
    for (const channel in densityMap) {
      if (!densityMap[channel]) continue;
      options[channel] = channelOption({ channel, as: 'value' });
    }
    return [{ type, data, options }];
  }
}

function transform(geometry, x, y) {
  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }

  function transformPoint(coordinates) {
    coordinates[0] = x(coordinates[0]);
    coordinates[1] = y(coordinates[1]);
  }

  geometry.coordinates.forEach(transformPolygon);
  return geometry;
}
