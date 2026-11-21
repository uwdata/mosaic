import { contours, type ContourMultiPolygon } from 'd3';
import { gridDomainContinuous } from './util/grid.js';
import { handleParam } from './util/handle-param.js';
import { Grid2DMark, type Grid2DOptions } from './Grid2DMark.js';
import { channelOption, type EncodingName, type PlotMarkSpec } from './Mark.js';
import type { CanParam } from '../types.js';

type ContourOptions = Grid2DOptions & { thresholds?: CanParam<number | number[]>; };

export class ContourMark extends Grid2DMark {
  thresholds: number | number[];
  contourData?: number[];
  constructor(source: any, options: ContourOptions) {
    const { thresholds = 10, ...channels } = options;
    super('geo', source, {
      bandwidth: 20,
      interpolate: 'linear',
      pixelSize: 2,
      ...channels
    });

    this.thresholds = handleParam(thresholds, value => {
      this.thresholds = value;
      return this.grids ? this.contours().update() : null;
    });
  }

  convolve(): this {
    return super.convolve().contours();
  }

  contours(): this {
    const { bins, densityMap, grids, thresholds, plot } = this;
    const { numRows, columns } = grids;

    const t = thresholds;
    let tz: number[];
    if (Array.isArray(t)) {
      tz = t;
    } else {
      const [, hi] = gridDomainContinuous(columns.density);
      tz = Array.from({ length: t - 1 }, (_, i) => (hi * (i + 1)) / t);
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
    const x = (v: number) => xo + v * sx;
    const y = (v: number) => yo + v * sy;
    const contour = contours().size(bins);

    // generate contours
    const data = this.contourData = Array(numRows * tz.length);
    const { density, ...groupby } = columns;
    const groups = Object.entries(groupby);
    for (let i = 0, k = 0; i < numRows; ++i) {
      const grid = density[i] as number[];
      const rest = groups.reduce((o, [name, col]) => (o[name] = col[i], o), {} as Record<string, any>);
      for (let j = 0; j < tz.length; ++j, ++k) {
        // annotate contour geojson with cell groupby fields
        // d3-contour already adds a threshold "value" property
        data[k] = Object.assign(
          transform(contour.contour(grid, tz[j]), x, y),
          rest
        );
      }
    }

    return this;
  }

  plotSpecs(): PlotMarkSpec[] {
    const { type, channels, densityMap, contourData: data } = this;
    const options = {} as Record<string, ReturnType<typeof channelOption>>;
    for (const c of channels) {
      const { channel } = c;
      if (channel !== 'x' && channel !== 'y') {
        options[channel] = channelOption(c);
      }
    }
    // d3-contour adds a threshold "value" property
    // here we ensure requested density values are encoded
    for (const c in densityMap) {
      const channel = c as EncodingName;
      if (!densityMap[channel]) continue;
      options[channel] = channelOption({ channel: channel, as: 'value' });
    }
    return [{ type, data, options }];
  }
}

function transform(geometry: ContourMultiPolygon, x: { (v: any): number; (arg0: any): any; }, y: { (v: any): number; (arg0: any): any; }): ContourMultiPolygon {
  function transformPolygon(coordinates: number[][][]): void {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates: number[][]): void {
    coordinates.forEach(transformPoint);
  }

  function transformPoint(coordinates: number[]): void {
    coordinates[0] = x(coordinates[0]);
    coordinates[1] = y(coordinates[1]);
  }

  geometry.coordinates.forEach(transformPolygon);
  return geometry;
}
