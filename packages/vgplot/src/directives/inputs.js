import { coordinator } from '@mosaic/core';
import { Menu, Search, Slider, Table } from '@mosaic/inputs';

function input(InputClass, options) {
  const input = new InputClass(options);
  coordinator().connect(input);
  return input.element;
}

export const menu = options => input(Menu, options);
export const search = options => input(Search, options);
export const slider = options => new Slider(options).element;
export const table = options => input(Table, options);
