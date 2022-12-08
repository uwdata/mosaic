import { Mark } from '../mark.js';
import { DensityMark } from '../marks/density-mark.js';

export function mark(type, data, channels) {
  if (arguments.length === 2) {
    channels = data;
    data = null;
  }
  return plot => {
    plot.addMark(new Mark(type, data, channels));
  };
}

export const area = (...args) => mark('area', ...args);
export const areaX = (...args) => mark('areaX', ...args);
export const areaY = (...args) => mark('areaY', ...args);

export const bar = (...args) => mark('bar', ...args);
export const barX = (...args) => mark('barX', ...args);
export const barY = (...args) => mark('barY', ...args);

export const rectX = (...args) => mark('rectX', ...args);
export const rectY = (...args) => mark('rectY', ...args);

export const dot = (...args) => mark('dot', ...args);
export const dotX = (...args) => mark('dotX', ...args);
export const dotY = (...args) => mark('dotY', ...args);
export const circle = (...args) => mark('circle', ...args);
export const hexagon = (...args) => mark('hexagon', ...args);

export const ruleX = (...args) => mark('ruleX', ...args);
export const ruleY = (...args) => mark('ruleY', ...args);

export const frame = (...args) => mark('frame', ...args);

export function densityY(data, channels) {
  return plot => {
    plot.addMark(new DensityMark('areaY', data, channels));
  };
}
