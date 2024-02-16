import { Plot } from '@uwdata/mosaic-plot';
import { connect } from '../connect.js';

export function plot(...directives) {
  const p = new Plot();
  directives.flat().forEach(dir => dir(p));
  connect(this, ...p.marks); // this -> optional API context
  return p.element;
}
