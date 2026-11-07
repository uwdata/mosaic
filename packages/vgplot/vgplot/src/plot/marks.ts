// TODO @dangotbanned: Try to identify a path forward
// Correctly typing *this impl* will be expensive to check and take ages to write
import {
  Mark,
  ConnectedMark,
  ContourMark,
  Density1DMark,
  Density2DMark,
  DenseLineMark,
  ErrorBarMark,
  GeoMark,
  HeatmapMark,
  HexbinMark,
  RasterMark,
  RasterTileMark,
  RegressionMark,
} from '@uwdata/mosaic-plot';
import type { PlotDirective, MarkType } from './types.js';
const decorators = new Set([
  'frame',
  'axisX', 'axisY', 'axisFx', 'axisFy',
  'gridX', 'gridY', 'gridFx', 'gridFy',
  'hexgrid',
  'graticule', 'sphere'
]);

function mark(type: MarkType, data: any, channels: Record<string, string> = {}): PlotDirective {
  if (arguments.length === 2 && !Array.isArray(data)) {
    channels = data;
    data = decorators.has(type) ? null : [{}];
  }
  const MarkClass = type.startsWith('area') || type.startsWith('line')
    ? ConnectedMark
    : Mark;

  return explicitType(MarkClass, type, data, channels);
}

function explicitType(MarkClass: typeof Mark, type: MarkType, data?: any, channels?: Record<string, string>): PlotDirective {
  return plot => {
    plot.addMark(new MarkClass(type, data, channels));
  };
}

function implicitType(MarkClass: typeof Mark, data?: any, channels?: Record<string, string>): PlotDirective {
  return plot => {
    plot.addMark(new MarkClass(data, channels));
  };
}
//@ts-expect-error A spread argument must either have a tuple type or be passed to a rest parameter.
export const area = (...args) => mark('area', ...args);
//@ts-expect-error 
export const areaX = (...args) => mark('areaX', ...args);
//@ts-expect-error 
export const areaY = (...args) => mark('areaY', ...args);

//@ts-expect-error 
export const line = (...args) => mark('line', ...args);
//@ts-expect-error
export const lineX = (...args) => mark('lineX', ...args);
//@ts-expect-error 
export const lineY = (...args) => mark('lineY', ...args);
//@ts-expect-error 
export const barX = (...args) => mark('barX', ...args);
//@ts-expect-error 
export const barY = (...args) => mark('barY', ...args);
//@ts-expect-error 
export const cell = (...args) => mark('cell', ...args);
//@ts-expect-error 
export const cellX = (...args) => mark('cellX', ...args);
//@ts-expect-error 
export const cellY = (...args) => mark('cellY', ...args);
//@ts-expect-error 
export const rect = (...args) => mark('rect', ...args);
//@ts-expect-error 
export const rectX = (...args) => mark('rectX', ...args);
//@ts-expect-error 
export const rectY = (...args) => mark('rectY', ...args);

//@ts-expect-error 
export const dot = (...args) => mark('dot', ...args);
//@ts-expect-error 
export const dotX = (...args) => mark('dotX', ...args);
//@ts-expect-error 
export const dotY = (...args) => mark('dotY', ...args);
//@ts-expect-error 
export const circle = (...args) => mark('circle', ...args);
//@ts-expect-error 
export const hexagon = (...args) => mark('hexagon', ...args);
//@ts-expect-error
export const text = (...args) => mark('text', ...args);
//@ts-expect-error
export const textX = (...args) => mark('textX', ...args);
//@ts-expect-error
export const textY = (...args) => mark('textY', ...args);
//@ts-expect-error

export const ruleX = (...args) => mark('ruleX', ...args);
//@ts-expect-error
export const ruleY = (...args) => mark('ruleY', ...args);
//@ts-expect-error

export const tickX = (...args) => mark('tickX', ...args);
//@ts-expect-error
export const tickY = (...args) => mark('tickY', ...args);
//@ts-expect-error

export const vector = (...args) => mark('vector', ...args);
//@ts-expect-error
export const vectorX = (...args) => mark('vectoX', ...args);
//@ts-expect-error
export const vectorY = (...args) => mark('vectorY', ...args);
//@ts-expect-error
export const spike = (...args) => mark('spike', ...args);
//@ts-expect-error

export const image = (...args) => mark('image', ...args);

export const densityX = (...args) => explicitType(Density1DMark, 'areaX', ...args);
export const densityY = (...args) => explicitType(Density1DMark, 'areaY', ...args);

export const density = (...args) => implicitType(Density2DMark, ...args);
export const denseLine = (...args) => implicitType(DenseLineMark, ...args);
export const contour = (...args) => implicitType(ContourMark, ...args);
export const heatmap = (...args) => implicitType(HeatmapMark, ...args);
export const raster = (...args) => implicitType(RasterMark, ...args);
export const rasterTile = (...args) => implicitType(RasterTileMark, ...args);

export const hexbin = (...args) => implicitType(HexbinMark, ...args);
//@ts-expect-error
export const hexgrid = (...args) => mark('hexgrid', ...args);

export const regressionY = (...args) => implicitType(RegressionMark, ...args);

export const errorbarX = (...args) => explicitType(ErrorBarMark, 'ruleY', ...args);
export const errorbarY = (...args) => explicitType(ErrorBarMark, 'ruleX', ...args);

//@ts-expect-error
export const voronoi = (...args) => mark('voronoi', ...args);
//@ts-expect-error
export const voronoiMesh = (...args) => mark('voronoiMesh', ...args);
//@ts-expect-error
export const delaunayLink = (...args) => mark('delaunayLink', ...args);
//@ts-expect-error
export const delaunayMesh = (...args) => mark('delaunayMesh', ...args);
//@ts-expect-error
export const hull = (...args) => mark('hull', ...args);
//@ts-expect-error

export const arrow = (...args) => mark('arrow', ...args);
//@ts-expect-error
export const link = (...args) => mark('link', ...args);
//@ts-expect-error

export const frame = (...args) => mark('frame', ...args);
//@ts-expect-error

export const axisX = (...args) => mark('axisX', ...args);
//@ts-expect-error
export const axisY = (...args) => mark('axisY', ...args);
//@ts-expect-error
export const axisFx = (...args) => mark('axisFx', ...args);
//@ts-expect-error
export const axisFy = (...args) => mark('axisFy', ...args);
//@ts-expect-error

export const gridX = (...args) => mark('gridX', ...args);
//@ts-expect-error
export const gridY = (...args) => mark('gridY', ...args);
//@ts-expect-error
export const gridFx = (...args) => mark('gridFx', ...args);
//@ts-expect-error
export const gridFy = (...args) => mark('gridFy', ...args);

export const geo = (...args) => implicitType(GeoMark, ...args);
//@ts-expect-error
export const sphere = (...args) => mark('sphere', ...args);
//@ts-expect-error
export const graticule = (...args) => mark('graticule', ...args);

//@ts-expect-error
export const waffleX = (...args) => mark('waffleX', ...args);
//@ts-expect-error
export const waffleY = (...args) => mark('waffleY', ...args);
