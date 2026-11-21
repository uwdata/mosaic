import type { ConcatElement } from '../plot/types.js';

function concat<Nodes extends Node[]>(children: Nodes, direction: 'horizontal' | 'vertical' = 'vertical', wrap: boolean = false): ConcatElement {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
  div.style.flexWrap = !wrap ? 'nowrap' : wrap === true ? 'wrap' : wrap;
  div.style.justifyContent = 'flex-start';
  div.style.alignItems = 'flex-start';
  children.forEach((child) => div.appendChild(child));
  return Object.assign(div, { value: { element: div } });
}

export function vconcat<Nodes extends Node[]>(...plots: Nodes): ConcatElement {
  return concat(plots, 'vertical');
}

export function hconcat<Nodes extends Node[]>(...plots: Nodes): ConcatElement {
  return concat(plots, 'horizontal');
}
