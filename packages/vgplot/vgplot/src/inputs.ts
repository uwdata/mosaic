// oxlint-disable oxc/no-this-in-exported-function
import { Menu, Search, Slider, Table } from '@uwdata/mosaic-inputs';
import type { Input } from '@uwdata/mosaic-inputs';

import { connect } from './connect.js';
import type { APIContext } from './context.js';

function input<T extends Input>(
  ctx: APIContext,
  InputClass: new (options: unknown) => T,
  // oxlint-disable-next-line typescript/no-explicit-any
  options: any,
): HTMLElement {
  // oxlint-disable-next-line no-shadow
  const input = new InputClass(options);
  connect(ctx, input);
  return input.element;
}

export function menu(options: ConstructorParameters<typeof Menu>): HTMLElement {
  return input(this, Menu, options);
}

export function search(options: ConstructorParameters<typeof Search>): HTMLElement {
  return input(this, Search, options);
}

export function slider(options: ConstructorParameters<typeof Slider>): HTMLElement {
  return input(this, Slider, options);
}

export function table(options: ConstructorParameters<typeof Table>): HTMLElement {
  return input(this, Table, options);
}
