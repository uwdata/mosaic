type Concat = HTMLDivElement & { value: { element: HTMLDivElement } };

function concat<Nodes extends Node[]>(children: Nodes, direction: 'horizontal' | 'vertical' = 'vertical', wrap: boolean = false): Concat {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
  div.style.flexWrap = !wrap ? 'nowrap' : wrap === true ? 'wrap' : wrap;
  div.style.justifyContent = 'flex-start';
  div.style.alignItems = 'flex-start';
  children.forEach((child) => div.appendChild(child));
  return Object.assign(div, { value: { element: div } });
}

// TODO @dangotbanned: Remove `flat`, which was working around ast instantiate bug
export function vconcat<Nodes extends Node[]>(...plots: Nodes): Concat {
  return concat(plots.flat(), 'vertical');
}

// TODO @dangotbanned: Remove `flat`, which was working around ast instantiate bug
export function hconcat<Nodes extends Node[]>(...plots: Nodes): Concat {
  return concat(plots.flat(), 'horizontal');
}
