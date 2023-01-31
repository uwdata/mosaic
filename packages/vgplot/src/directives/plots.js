import { coordinator } from '@mosaic/core';
import { Concat } from '../concat.js';
import { Plot } from '../plot.js';

export function plot(...directives) {
  const p = new Plot();
  directives.flat().forEach(dir => dir(p));
  p.marks.forEach(mark => coordinator().connect(mark));
  return p.element;
}

export function vconcat(...plots) {
  return new Concat(plots.flat(), { type: 'vertical' }).element;
}

export function hconcat(...plots) {
  return new Concat(plots.flat(), { type: 'horizontal' }).element;
}

function space(dim = 'width', size = 10) {
  const span = document.createElement('span');
  span.style.display = 'inline-block';
  span.style[dim] = Number.isNaN(+size) ? size : `${size}px`;
  const obj = { element: span };
  span.value = obj;
  return span;
}

export function vspace(size) {
  return space('height', size);
}

export function hspace(size) {
  return space('width', size);
}
