const symbols = new Set([
  'asterisk',
  'circle',
  'cross',
  'diamond',
  'diamond2',
  'hexagon',
  'plus',
  'square',
  'square2',
  'star',
  'times',
  'triangle',
  'triangle2',
  'wye'
]);

export function isSymbol(value) {
  return symbols.has(`${value}`.toLowerCase());
}
