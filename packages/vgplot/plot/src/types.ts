import * as ObPlot from '@observablehq/plot';

import type { attributeMap } from './plot-attributes.js';
import type * as mc from '@uwdata/mosaic-core';
import type { Fixed } from './symbols.js';

export type MarkType = 'text' | 'area' | 'areaX' | 'areaY' | 'arrow' | 'axisX' | 'axisY' | 'axisFx' | 'axisFy' | 'gridX' | 'gridY' | 'gridFx' | 'gridFy' | 'barX' | 'barY' | 'cell' | 'cellX' | 'cellY' | 'contour' | 'delaunayLink' | 'delaunayMesh' | 'hull' | 'voronoi' | 'voronoiMesh' | 'denseLine' | 'density' | 'densityX' | 'densityY' | 'dot' | 'dotX' | 'dotY' | 'circle' | 'hexagon' | 'errorbarX' | 'errorbarY' | 'frame' | 'geo' | 'graticule' | 'sphere' | 'hexbin' | 'hexgrid' | 'image' | 'line' | 'lineX' | 'lineY' | 'link' | 'raster' | 'heatmap' | 'rasterTile' | 'rect' | 'rectX' | 'rectY' | 'regressionY' | 'ruleX' | 'ruleY' | 'textX' | 'textY' | 'tickX' | 'tickY' | 'vector' | 'vectorX' | 'vectorY' | 'spike' | 'waffleX' | 'waffleY';

export type AttrName = Parameters<(typeof attributeMap)['get']>[0];

export type Attributes = { [name in AttrName]?: any };

/**Observable Plot spec. */
export type Spec = { [x: string]: any; marks?: ObPlot.Mark[]; };

/**Observable plot element */
export type SVG = (SVGSVGElement | HTMLElement) & ObPlot.Plot;

export type Extent = [any, any];

export interface Interactor {
  init: (svg: SVG) => Promise<void> | void;
  reset?(): void;
  publish?(extent: Extent): void;
  clause?(value: unknown): mc.SelectionClause;
}

export type ChannelName =
  | 'ariaLabel'
  | 'fill'
  | 'fillOpacity'
  | 'fontSize'
  | 'fx'
  | 'fy'
  | 'geometry'
  | 'height'
  | 'href'
  | 'length'
  | 'opacity'
  | 'path'
  | 'r'
  | 'rotate'
  | 'src'
  | 'stroke'
  | 'strokeOpacity'
  | 'strokeWidth'
  | 'symbol'
  | 'text'
  | 'title'
  | 'weight'
  | 'width'
  | 'x'
  | 'x1'
  | 'x2'
  | 'y'
  | 'y1'
  | 'y2'
  | 'z'
  | 'color';

export type FixedType = typeof Fixed;