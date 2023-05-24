import { coordinator } from '@uwdata/mosaic-core';
import { Plot } from '../plot.js';

export function plot(...directives) {
  const p = new Plot();
  directives.flat().forEach(dir => dir(p));
  p.marks.forEach(mark => coordinator().connect(mark));
  return p.element;
}

export class NamedPlots extends Map {
  request(name, callback) {
    if (this.has(name)) {
      callback(this.get(name));
    } else {
      const waiting = this.waiting || (this.waiting = new Map);
      const list = waiting.get(name) || [];
      waiting.set(name, list.concat(callback));
    }
  }
  set(name, plot) {
    if (this.has(name)) {
      console.warn(`Overwriting named plot "${name}".`);
    }
    const { waiting } = this;
    if (waiting?.has(name)) {
      waiting.get(name).forEach(fn => fn(plot));
      waiting.delete(name);
    }
    return super.set(name, plot);
  }
}

export const namedPlots = new NamedPlots();

export function reset() {
  namedPlots.clear();
  coordinator().clear();
}
