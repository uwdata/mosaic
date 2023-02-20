export function concat({ direction = 'vertical', wrap = false }, children) {
  const div = document.createElement('div');
  div.style.display = 'flex';
  div.style.flexDirection = direction === 'vertical' ? 'column' : 'row';
  div.style.flexWrap = !wrap ? 'nowrap' : wrap === true ? 'wrap' : wrap;
  div.style.justifyContent = 'flex-start';
  div.style.alignItems = 'flex-start';
  children.forEach(child => div.appendChild(child));
  div.value = { element: div };
  return div;
}

export function vconcat(...plots) {
  return concat({ direction: 'vertical' }, plots.flat());
}

export function hconcat(...plots) {
  return concat({ direction: 'horizontal' }, plots.flat());
}

export function space({ dim = 'width', size = 10 }) {
  const span = document.createElement('span');
  span.style.display = 'inline-block';
  span.style[dim] = Number.isNaN(+size) ? size : `${size}px`;
  const obj = { element: span };
  span.value = obj;
  return span;
}

export function vspace(size) {
  return space({ dim: 'height', size });
}

export function hspace(size) {
  return space({ dim: 'width', size });
}
