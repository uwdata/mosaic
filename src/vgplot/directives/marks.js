import { Mark } from '../marks/Mark.js';
import { ContinuousMark } from '../marks/ContinuousMark.js';
import { DensityMark } from '../marks/DensityMark.js';
import { ContourMark } from '../marks/ContourMark.js';
import { HeatmapMark } from '../marks/HeatmapMark.js';
import { HexbinMark } from '../marks/HexbinMark.js';
import { RegressionMark } from '../marks/RegressionMark.js';

export function mark(type, data, channels) {
  if (arguments.length === 2) {
    channels = data;
    data = null;
  }
  const MarkClass = type.startsWith('area') || type.startsWith('line')
    ? ContinuousMark
    : Mark;
  return plot => {
    plot.addMark(new MarkClass(type, data, channels));
  };
}

export function typedMark(MarkClass, data, channels) {
  return plot => {
    plot.addMark(new MarkClass(data, channels));
  };
}

export const area = (...args) => mark('area', ...args);
export const areaX = (...args) => mark('areaX', ...args);
export const areaY = (...args) => mark('areaY', ...args);

export const bar = (...args) => mark('bar', ...args);
export const barX = (...args) => mark('barX', ...args);
export const barY = (...args) => mark('barY', ...args);

export const line = (...args) => mark('line', ...args);
export const lineX = (...args) => mark('lineX', ...args);
export const lineY = (...args) => mark('lineY', ...args);

export const rectX = (...args) => mark('rectX', ...args);
export const rectY = (...args) => mark('rectY', ...args);

export const dot = (...args) => mark('dot', ...args);
export const dotX = (...args) => mark('dotX', ...args);
export const dotY = (...args) => mark('dotY', ...args);
export const circle = (...args) => mark('circle', ...args);
export const hexagon = (...args) => mark('hexagon', ...args);

export const ruleX = (...args) => mark('ruleX', ...args);
export const ruleY = (...args) => mark('ruleY', ...args);

export const tickX = (...args) => mark('tickX', ...args);
export const tickY = (...args) => mark('tickY', ...args);

export const frame = (...args) => mark('frame', ...args);

export function densityMark(type, data, channels) {
  return plot => {
    plot.addMark(new DensityMark(type, data, channels));
  };
}
export const densityX = (...args) => densityMark('areaX', ...args);
export const densityY = (...args) => densityMark('areaY', ...args);

export const contour = (...args) => typedMark(ContourMark, ...args);
export const heatmap = (...args) => typedMark(HeatmapMark, ...args);
export const hexbin = (...args) => typedMark(HexbinMark, ...args);
export const hexgrid = (...args) => mark('hexgrid', ...args);

export function regressionY(data, channels) {
  return plot => {
    plot.addMark(new RegressionMark(data, channels));
  };
}
