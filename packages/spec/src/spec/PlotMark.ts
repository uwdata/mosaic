import { Expression } from './Expression.js';
import { ParamRef } from './Param.js';
import { PlotMarkData } from './PlotFrom.js';
import { Transform } from './Transform.js';
import { Area, AreaX, AreaY } from './marks/Area.js';
import { AxisFx, AxisFy, AxisX, AxisY, GridFx, GridFy, GridX, GridY } from './marks/Axis.js';
import { BarX, BarY } from './marks/Bar.js';
import { Cell, CellX, CellY } from './marks/Cell.js';
import { Circle, Dot, DotX, DotY, Hexagon } from './marks/Dot.js';
import { Frame } from './marks/Frame.js';
import { Line, LineX, LineY } from './marks/Line.js';
import { Rect, RectX, RectY } from './marks/Rect.js';
import { RuleX, RuleY } from './marks/Rule.js';
import { Text,TextX, TextY } from './marks/Text.js';
import { TickX, TickY } from './marks/Tick.js';

export type MarkType =
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
  | AxisX | AxisY | AxisFx | AxisFy | GridX | GridY | GridFx | GridFy
  | BarX | BarY
  | Cell | CellX | CellY
  | Dot | DotX | DotY | Circle | Hexagon
  | Frame
  | Line | LineX | LineY
  | Rect | RectX | RectY
  | RuleX | RuleY
  | Text | TextX | TextY
  | TickX | TickY
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
