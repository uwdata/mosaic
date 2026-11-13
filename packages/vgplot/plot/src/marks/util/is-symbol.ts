const SYMBOLS = [
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
] as const

const symbols = new Set(SYMBOLS);
export type SymbolType = (typeof SYMBOLS)[number]
export function isSymbol(value: any): value is SymbolType {
  //@ts-expect-error value must already be lowercase https://github.com/uwdata/mosaic/blob/367cbf69588961ec588f05a04cceed42523aaebd/packages/vgplot/spec/src/spec/PlotTypes.ts#L410-L425
  return symbols.has(`${value}`.toLowerCase());
}
