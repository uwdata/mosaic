// oxlint-disable oxc/no-this-in-exported-function
import { Menu, Search, Slider, Table } from '@uwdata/mosaic-inputs';
import type { Input } from '@uwdata/mosaic-inputs';

import { connect } from './connect.js';
import type { APIContext } from './context.js';

type Options<T extends abstract new (...args: any) => any> = (ConstructorParameters<T>)[0]

function input<T extends Input>(
  ctx: ThisType<APIContext>,
  InputClass: new (options: unknown) => T,
  // oxlint-disable-next-line typescript/no-explicit-any
  options: any,
): HTMLElement {
  // oxlint-disable-next-line no-shadow
  const input = new InputClass(options);
  connect(ctx as APIContext, input);
  return input.element;
}

export function menu(this: ThisType<APIContext>, options: Options<typeof Menu> = {}): HTMLElement {
  return input(this, Menu, options);
}

export function search(this: ThisType<APIContext>, options: Options<typeof Search> = {}): HTMLElement {
  return input(this, Search, options);
}

export function slider(this: ThisType<APIContext>, options: Options<typeof Slider> = {}): HTMLElement {
  return input(this, Slider, options);
}

export function table(this: ThisType<APIContext>, options: Options<typeof Table> = {}): HTMLElement {
  return input(this, Table, options);
}
