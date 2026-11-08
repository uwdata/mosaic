import type { SpaceElement } from '../plot/types.js';

interface Options {
  dim: 'height' | 'width';
  size: number | string;
}

export function space({ dim = 'width', size = 10 }: Options): SpaceElement {
  const span = document.createElement('span');
  span.style.display = 'inline-block';
  // @ts-expect-error 'number' is not assignable to 'string'
  span.style[dim] = Number.isNaN(+size) ? size : `${size}px`;
  return Object.assign(span, { value: { element: span } });
}

export function vspace(size: number | string): SpaceElement {
  return space({ dim: 'height', size });
}

export function hspace(size: number | string): SpaceElement {
  return space({ dim: 'width', size });
}
