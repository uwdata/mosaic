import { Menu, Search, Slider, Table } from '@uwdata/mosaic-inputs';
import { connect } from './connect.js';

function input(ctx, InputClass, options) {
  const input = new InputClass(options);
  connect(ctx, input); // ctx <- optional API context
  return input.element;
}

export function menu(options) {
  return input(this, Menu, options);
}

export function search(options) {
  return input(this, Search, options);
}

export function slider(options) {
  return input(this, Slider, options);
}

export function table(options) {
  return input(this, Table, options);
}
