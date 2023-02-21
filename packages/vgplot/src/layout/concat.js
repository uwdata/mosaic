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
