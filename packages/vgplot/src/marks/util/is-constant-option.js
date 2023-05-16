const constantOptions = new Set([
  'order',
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
  'pointerEvents'
]);

export function isConstantOption(value) {
  return constantOptions.has(value);
}
