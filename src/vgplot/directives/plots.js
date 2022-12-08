import { Search } from '../../inputs/Search.js';
import { Coordinator } from '../../mosaic/Coordinator.js';
import { Concat } from '../concat.js';
import { Plot } from '../plot.js';

// TODOs?
// Make directives return a partial Plot object, then merge?
// Allow directives in concat methods, pass down to subplots
// Don't update plot right away, schedule it instead?

// TODO move this elsewhere...
export const mc = new Coordinator();

export function search(options) {
  const s = new Search(options);
  mc.connect(s);
  return s.element;
}

export function plot(...directives) {
  const p = new Plot();
  directives.flat().forEach(dir => dir(p));
  p.marks.forEach(mark => mc.connect(mark));
  return p.element;
}

export function vconcat(...plots) {
  // TODO handle directives, too
  return new Concat(
    plots.flat().map(el => el.value),
    { type: 'vertical' }
  ).element;
}

export function hconcat(...plots) {
  // TODO handle directives, too
  return new Concat(
    plots.flat().map(el => el.value),
    { type: 'horizontal' }
  ).element;
}
