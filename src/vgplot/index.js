export {
  Selection
} from '../mosaic/Selection.js';

export {
  Signal
} from '../mosaic/Signal.js';

export {
  Plot
} from './plot.js';

export {
  Mark
} from './marks/Mark.js';

export {
  Fixed
} from './symbols.js';

export {
  attribute,
  attributes,
  width,
  height,
  margin,
  margins,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  axisX,
  axisY,
  grid,
  gridX,
  gridY,
  lineX,
  lineY,
  scaleX,
  scaleY,
  domainX,
  domainY,
  domainXY,
  domainFX,
  domainFY,
  niceX,
  niceY,
  zeroX,
  zeroY,
  ticksX,
  ticksY,
  tickFormatX,
  tickFormatY,
  tickRotateX,
  tickRotateY,
  tickSizeX,
  tickSizeY,
  labelX,
  labelY,
  labelAnchorX,
  labelAnchorY,
  labelOffsetX,
  labelOffsetY,
  scaleColor,
  domainColor,
  rangeColor,
  schemeColor,
  interpolateColor,
  domainR,
  rangeR
} from './directives/attributes.js';

export {
  from,
  bin,
} from './directives/data.js';

export {
  avg,
  count,
  max,
  median,
  min,
  mode,
  quantile,
  sum
} from '../sql/index.js';

export {
  mark,
  area,
  areaX,
  areaY,
  bar,
  barX,
  barY,
  rectX,
  rectY,
  dot,
  dotX,
  dotY,
  circle,
  hexagon,
  ruleX,
  ruleY,
  frame,
  tickX,
  tickY,
  densityY,
  heatmap,
  contour,
  hexbin,
  hexgrid,
  regressionY
} from './directives/marks.js';

export {
  highlight,
  intervalX,
  intervalY,
  intervalXY,
  select,
  selectX,
  selectY,
  selectColor
} from './directives/selections';

export {
  plot,
  hconcat,
  vconcat,
  menu,
  search,
  table,
  mc
} from './directives/plots.js';

export {
  wasmClient
} from '../duckdb-wasm/wasm.js';
