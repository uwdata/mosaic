import { Mark } from '../marks/Mark.js';
import { ConnectedMark } from '../marks/ConnectedMark';
import { Density1DMark } from '../marks/Density1DMark.js';
import { Density2DMark } from '../marks/Density2DMark.js';
import { DenseLineMark } from '../marks/DenseLineMark.js';
import { ContourMark } from '../marks/ContourMark.js';
import { HexbinMark } from '../marks/HexbinMark.js';
import { RasterMark } from '../marks/RasterMark.js';
import { RasterTileMark } from '../marks/RasterTileMark.js';
import { RegressionMark } from '../marks/RegressionMark.js';

const decorators = new Set(['frame', 'hexgrid', 'graticule', 'sphere']);

function mark(type, data, channels) {
  if (arguments.length === 2) {
    channels = data;
    data = decorators.has(type) ? null : [{}];
  }
  const MarkClass = type.startsWith('area') || type.startsWith('line')
    ? ConnectedMark
    : Mark;

  return explicitType(MarkClass, type, data, channels);
}

function explicitType(MarkClass, type, data, channels) {
  return plot => {
    plot.addMark(new MarkClass(type, data, channels));
  };
}

function implicitType(MarkClass, data, channels) {
  return plot => {
    plot.addMark(new MarkClass(data, channels));
  };
}

export const area = (...args) => mark('area', ...args);
export const areaX = (...args) => mark('areaX', ...args);
export const areaY = (...args) => mark('areaY', ...args);

export const line = (...args) => mark('line', ...args);
export const lineX = (...args) => mark('lineX', ...args);
export const lineY = (...args) => mark('lineY', ...args);

export const bar = (...args) => mark('bar', ...args);
export const barX = (...args) => mark('barX', ...args);
export const barY = (...args) => mark('barY', ...args);

export const cell = (...args) => mark('cell', ...args);
export const cellX = (...args) => mark('cellX', ...args);
export const cellY = (...args) => mark('cellY', ...args);

export const rect = (...args) => mark('rect', ...args);
export const rectX = (...args) => mark('rectX', ...args);
export const rectY = (...args) => mark('rectY', ...args);

export const dot = (...args) => mark('dot', ...args);
export const dotX = (...args) => mark('dotX', ...args);
export const dotY = (...args) => mark('dotY', ...args);
export const circle = (...args) => mark('circle', ...args);
export const hexagon = (...args) => mark('hexagon', ...args);

export const text = (...args) => mark('text', ...args);
export const textX = (...args) => mark('textX', ...args);
export const textY = (...args) => mark('textY', ...args);

export const ruleX = (...args) => mark('ruleX', ...args);
export const ruleY = (...args) => mark('ruleY', ...args);

export const tickX = (...args) => mark('tickX', ...args);
export const tickY = (...args) => mark('tickY', ...args);

export const frame = (...args) => mark('frame', ...args);

export const densityX = (...args) => explicitType(Density1DMark, 'areaX', ...args);
export const densityY = (...args) => explicitType(Density1DMark, 'areaY', ...args);

export const density = (...args) => implicitType(Density2DMark, ...args);
export const denseLine = (...args) => implicitType(DenseLineMark, ...args);
export const contour = (...args) => implicitType(ContourMark, ...args);
export const raster = (...args) => implicitType(RasterMark, ...args);
export const rasterTile = (...args) => implicitType(RasterTileMark, ...args);

export const hexbin = (...args) => implicitType(HexbinMark, ...args);
export const hexgrid = (...args) => mark('hexgrid', ...args);

export const regressionY = (...args) => implicitType(RegressionMark, ...args);
