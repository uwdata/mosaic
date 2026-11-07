import { Plot } from '@uwdata/mosaic-plot';
import { connect } from '../connect.js';
import type { Callback } from './types.js';

// TODO @dangotbanned: Remove `directives.flat`, which was working around ast instantiate bug
export function plot(...directives: Callback[]): HTMLElement {
  const p = new Plot();
  directives.flat().forEach(dir => dir(p));
  connect(this, ...p.marks);
  p.update(); // request update, needed if no marks are defined
  return p.element;
}
