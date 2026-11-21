// oxlint-disable oxc/no-this-in-exported-function
import { Menu, Search, Slider, Table } from '@uwdata/mosaic-inputs';
import type { Input } from '@uwdata/mosaic-inputs';

import { connect } from './connect.js';
import type { APIContext } from './context.js';

type Options<T extends abstract new (...args: any) => any> = (ConstructorParameters<T>)[0]

function input<T extends new (...args: any) => Input>(
  ctx: ThisType<APIContext>,
  InputClass: T,
  options: Options<T>
): HTMLElement {
  const component = new InputClass(options);
  connect(ctx as APIContext, component);
  return component.element;
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
