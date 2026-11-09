import { Plot } from '@uwdata/mosaic-plot';
import { connect } from '../connect.js';
import type { PlotDirective, PlotElement } from './types.js';
import type { APIContext } from '../context.js';

export function plot(this: ThisType<APIContext>, ...directives: PlotDirective[]): PlotElement {
  const p = new Plot();
  directives.forEach(dir => dir(p));
  connect(this as APIContext, ...p.marks);
  p.update(); // request update, needed if no marks are defined
  return p.element;
}
