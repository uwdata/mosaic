const CONSTANT_OPTIONS = [
  'offset',
  'order',
  'reverse',
  'sort',
  'label',
  'anchor',
  'curve',
  'tension',
  'marker',
  'markerStart',
  'markerMid',
  'markerEnd',
  'textAnchor',
  'lineAnchor',
  'lineHeight',
  'textOverflow',
  'monospace',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'frameAnchor',
  'strokeLinejoin',
  'strokeLinecap',
  'strokeMiterlimit',
  'strokeDasharray',
  'strokeDashoffset',
  'mixBlendMode',
  'shapeRendering',
  'imageRendering',
  'preserveAspectRatio',
  'interpolate',
  'crossOrigin',
  'paintOrder',
  'pointerEvents',
  'target',
  'select'
] as const

const constantOptions = new Set(CONSTANT_OPTIONS);
export type ConstantOption = (typeof CONSTANT_OPTIONS)[number]
export function isConstantOption(value: any): value is ConstantOption {
  return constantOptions.has(value);
}
