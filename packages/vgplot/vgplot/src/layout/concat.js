export function concat({ direction = 'vertical', wrap = false }, children) {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
  div.style.flexWrap = !wrap ? 'nowrap' : wrap === true ? 'wrap' : wrap;
  div.style.justifyContent = 'flex-start';
  div.style.alignItems = 'flex-start';
  children.forEach(child => div.appendChild(child));
  Object.assign(div, { value: { element: div } });
  return div;
}

export function vconcat(...plots) {
  return concat({ direction: 'vertical' }, plots.flat());
}

export function hconcat(...plots) {
  return concat({ direction: 'horizontal' }, plots.flat());
}

/**
 * Layer elements on top of one another, in order: later elements are drawn
 * over earlier ones. All elements share a single grid cell, so the container
 * is as large as its largest child and smaller children align to its top-left
 * corner.
 */
export function zconcat(...plots) {
  const div = document.createElement('div');
  div.style.display = 'grid';
  div.style.justifyItems = 'start';
  div.style.alignItems = 'start';
  plots.flat().forEach(child => {
    child.style.gridArea = '1 / 1';
    div.appendChild(child);
  });
  Object.assign(div, { value: { element: div } });
  return div;
}
