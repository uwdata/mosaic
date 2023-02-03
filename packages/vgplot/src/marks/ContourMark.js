import { contours, max } from 'd3';
import { isSignal } from '@uwdata/mosaic-core';
import { Density2DMark } from './Density2DMark.js';

export class ContourMark extends Density2DMark {
  constructor(source, options) {
    const { thresholds = 10, ...channels } = options;
    super('geo', source, channels);
    this.thresholds = thresholds;

    if (isSignal(thresholds)) {
      thresholds.addEventListener('value', value => {
        this.thresholds = value;
        if (this.grids) this.contours().update();
      });
      this.thresholds = thresholds.value;
    }
  }

  convolve() {
    return super.convolve().contours();
  }

  contours() {
    const { bins, kde, thresholds, groupby, plot } = this;

    let tz = thresholds;
    if (!Array.isArray(tz)) {
      const scale = max(kde.map(k => max(k)));
      tz = Array.from({length: tz - 1}, (_, i) => (scale * (i + 1)) / tz);
    }

    if (this.densityFill || this.densityStroke) {
      if (this.plot.getAttribute('scaleColor') !== 'log') {
        this.plot.setAttribute('zeroColor', true);
      }
    }

    // transform contours into data space coordinates
    // so we play nice with scale domains & axes
    const [nx, ny] = bins;
    const [x0, x1] = plot.getAttribute('domainX');
    const [y0, y1] = plot.getAttribute('domainY');
    const sx = (x1 - x0) / nx;
    const sy = (y1 - y0) / ny;
    const x = v => x0 + v * sx;
    const y = v => y0 + v * sy;
    const contour = contours().size(bins);

    // generate contours
    this.data = kde.flatMap(k => tz.map(t => {
      const c = transform(contour.contour(k, t), x, y);
      groupby.forEach((name, i) => c[name] = k.key[i]);
      c.density = t;
      return c;
    }));

    return this;
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
