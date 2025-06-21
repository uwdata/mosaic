export function space({ dim = 'width', size = 10 }) {
  const span = document.createElement('span');
  span.style.display = 'inline-block';
  span.style[dim] = Number.isNaN(+size) ? size : `${size}px`;
  return Object.assign(span, { value: { element: span } });
}

export function vspace(size) {
  return space({ dim: 'height', size });
}

export function hspace(size) {
  return space({ dim: 'width', size });
}
