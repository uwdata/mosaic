import { Area, AreaX, AreaY } from './marks/Area.js';
import { Arrow } from './marks/Arrow.js';
import { AxisFx, AxisFy, AxisX, AxisY, GridFx, GridFy, GridX, GridY } from './marks/Axis.js';
import { BarX, BarY } from './marks/Bar.js';
import { Cell, CellX, CellY } from './marks/Cell.js';
import { Contour } from './marks/Contour.js';
import { DelaunayLink, DelaunayMesh, Hull, Voronoi, VoronoiMesh } from './marks/Delaunay.js';
import { DenseLine } from './marks/DenseLine.js';
import { Density, DensityX, DensityY } from './marks/Density.js';
import { Circle, Dot, DotX, DotY, Hexagon } from './marks/Dot.js';
import { ErrorBarX, ErrorBarY } from './marks/ErrorBar.js';
import { Frame } from './marks/Frame.js';
import { Geo, Graticule, Sphere } from './marks/Geo.js';
import { Hexbin } from './marks/Hexbin.js';
import { Hexgrid } from './marks/Hexgrid.js';
import { Image } from './marks/Image.js';
import { Line, LineX, LineY } from './marks/Line.js';
import { Link } from './marks/Link.js';
import { Heatmap, Raster, RasterTile } from './marks/Raster.js';
import { Rect, RectX, RectY } from './marks/Rect.js';
import { RegressionY } from './marks/Regression.js';
import { RuleX, RuleY } from './marks/Rule.js';
import { Text,TextX, TextY } from './marks/Text.js';
import { TickX, TickY } from './marks/Tick.js';
import { Spike, Vector, VectorX, VectorY } from './marks/Vector.js';
import { WaffleX, WaffleY } from './marks/Waffle.js';

/** A plot mark entry. */
export type PlotMark =
  | Area | AreaX | AreaY
  | Arrow
  | AxisX | AxisY | AxisFx | AxisFy | GridX | GridY | GridFx | GridFy
  | BarX | BarY
  | Cell | CellX | CellY
  | Contour
  | DelaunayLink | DelaunayMesh | Hull | Voronoi | VoronoiMesh
  | DenseLine
  | Density | DensityX | DensityY
  | Dot | DotX | DotY | Circle | Hexagon
  | ErrorBarX | ErrorBarY
  | Frame
  | Geo | Graticule | Sphere
  | Hexbin
  | Hexgrid
  | Image
  | Line | LineX | LineY
  | Link
  | Raster | Heatmap | RasterTile
  | Rect | RectX | RectY
  | RegressionY
  | RuleX | RuleY
  | Text | TextX | TextY
  | TickX | TickY
  | Vector | VectorX | VectorY | Spike
  | WaffleX | WaffleY;
