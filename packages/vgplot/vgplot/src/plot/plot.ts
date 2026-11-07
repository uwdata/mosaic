import { Plot } from '@uwdata/mosaic-plot';
import { connect } from '../connect.js';
import type { Callback } from './types.js';

export function plot(...directives: Callback[]): HTMLElement {
  const p = new Plot();
  directives.forEach(dir => dir(p));
  connect(this, ...p.marks);
  p.update(); // request update, needed if no marks are defined
  return p.element;
}
