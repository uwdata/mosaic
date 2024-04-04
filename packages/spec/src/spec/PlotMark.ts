import { Expression } from './Expression.js';
import { ParamRef } from './Param.js';
import { PlotMarkData } from './PlotFrom.js';
import { Transform } from './Transform.js';
import { Area, AreaX, AreaY } from './marks/Area.js';
import { Circle, Dot, DotX, DotY, Hexagon } from './marks/Dot.js';
import { Line, LineX, LineY } from './marks/Line.js';

export type MarkType =
  // | 'area'
  // | 'areaX'
  // | 'areaY'
  // | 'line'
  // | 'lineX'
  // | 'lineY'
  | 'barX'
  | 'barY'
  | 'cell'
  | 'cellX'
  | 'cellY'
  | 'rect'
  | 'rectX'
  | 'rectY'
  // | 'dot'
  // | 'dotX'
  // | 'dotY'
  // | 'circle'
  // | 'hexagon'
  | 'text'
  | 'textX'
  | 'textY'
  | 'ruleX'
  | 'ruleY'
  | 'tickX'
  | 'tickY'
  | 'vector'
  | 'vectorX'
  | 'vectorY'
  | 'spike'
  | 'image'
  | 'densityX'
  | 'densityY'
  | 'density'
  | 'denseLine'
  | 'contour'
  | 'heatmap'
  | 'raster'
  | 'rasterTile'
  | 'hexbin'
  | 'hexgrid'
  | 'regressionY'
  | 'voronoi'
  | 'voronoiMesh'
  | 'delaunayLink'
  | 'delaunayMesh'
  | 'hull'
  | 'arrow'
  | 'link'
  | 'frame'
  | 'axisX'
  | 'axisY'
  | 'axisFx'
  | 'axisFy'
  | 'gridX'
  | 'gridY'
  | 'gridFx'
  | 'gridFy'
  | 'geo'
  | 'sphere'
  | 'graticule';

export type MarkOption =
  | ParamRef
  | number
  | string
  | boolean
  | Expression
  | Transform
  | any[];

export type PlotMark =
  | Area | AreaX | AreaY
  | Dot | DotX | DotY | Circle | Hexagon
  | Line | LineX | LineY
  | GenericPlotMark;

/**
 * A graphical mark (layer) for a plot.
 */
export interface GenericPlotMark {
  /** The mark type. */
  mark: MarkType;

  /** The data the mark should visualize. */
  data?: PlotMarkData;

  filter?: MarkOption;
  sort?: any;
  clip?: MarkOption;

  title?: MarkOption;
  tip?: MarkOption;
  href?: MarkOption;
  target?: MarkOption;
  frameAnchor?: MarkOption;

  x?: MarkOption;
  x1?: MarkOption;
  x2?: MarkOption;
  y?: MarkOption;
  y1?: MarkOption;
  y2?: MarkOption;
  fx?: MarkOption;
  fy?: MarkOption;

  z?: MarkOption;
  r?: MarkOption;
  length?: MarkOption;
  rotate?: MarkOption;
  symbol?: MarkOption;
  opacity?: MarkOption;
  fill?: MarkOption;
  fillOpacity?: MarkOption;
  stroke?: MarkOption;
  strokeOpacity?: MarkOption;
  strokeWidth?: MarkOption;
  strokeDasharray?: MarkOption;

  geometry?: MarkOption;

  text?: MarkOption;
  textAnchor?: MarkOption;
  lineAnchor?: MarkOption;
  fontSize?: MarkOption;
  dx?: MarkOption;
  dy?: MarkOption;

  anchor?: MarkOption;
  label?: MarkOption;
  labelAnchor?: MarkOption;
  tickFormat?: MarkOption;
  tickSize?: MarkOption;
  tickPadding?: MarkOption;

  bandwidth?: MarkOption;
  pixelSize?: MarkOption;
  interpolate?: MarkOption;
  pad?: MarkOption;

  width?: MarkOption;
  height?: MarkOption;

  src?: MarkOption;
  imageRendering?: MarkOption;
  preserveAspectRatio?: MarkOption;

  thresholds?: MarkOption;

  normalize?: MarkOption;

  binWidth?: MarkOption;
  inset?: MarkOption;
  curve?: MarkOption;
  marker?: MarkOption;
  bend?: MarkOption;
}
