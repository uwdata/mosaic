import { Menu } from '../../inputs/Menu.js';
import { Search } from '../../inputs/Search.js';
import { Slider } from '../../inputs/Slider.js';
import { Table } from '../../inputs/Table.js';
import { mc } from './coordinator.js';

function input(InputClass, options) {
  const input = new InputClass(options);
  mc.connect(input);
  return input.element;
}

export const menu = options => input(Menu, options);
export const search = options => input(Search, options);
export const slider = options => new Slider(options).element;
export const table = options => input(Table, options);
