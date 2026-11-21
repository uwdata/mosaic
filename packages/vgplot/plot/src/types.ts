import * as ObPlot from '@observablehq/plot';

import type { attributeMap } from './plot-attributes.js';
import type * as mc from '@uwdata/mosaic-core';
import type { Fixed, Transient } from './symbols.js';

export type MarkType = 'text' | 'area' | 'areaX' | 'areaY' | 'arrow' | 'axisX' | 'axisY' | 'axisFx' | 'axisFy' | 'gridX' | 'gridY' | 'gridFx' | 'gridFy' | 'barX' | 'barY' | 'cell' | 'cellX' | 'cellY' | 'contour' | 'delaunayLink' | 'delaunayMesh' | 'hull' | 'voronoi' | 'voronoiMesh' | 'denseLine' | 'density' | 'densityX' | 'densityY' | 'dot' | 'dotX' | 'dotY' | 'circle' | 'hexagon' | 'errorbarX' | 'errorbarY' | 'frame' | 'geo' | 'graticule' | 'sphere' | 'hexbin' | 'hexgrid' | 'image' | 'line' | 'lineX' | 'lineY' | 'link' | 'raster' | 'heatmap' | 'rasterTile' | 'rect' | 'rectX' | 'rectY' | 'regressionY' | 'ruleX' | 'ruleY' | 'textX' | 'textY' | 'tickX' | 'tickY' | 'vector' | 'vectorX' | 'vectorY' | 'spike' | 'waffleX' | 'waffleY';

export type AttrName = Parameters<(typeof attributeMap)['get']>[0];

export type Attributes = { [name in AttrName]?: any };

/**Observable Plot spec. */
export type Spec = { [x: string]: any; marks?: ObPlot.Markish[]; };

export type SVGHTMLElement = SVGSVGElement & HTMLElement;

/**Observable plot element .
 * 
 * Unlike the return type of {@link ObPlot.plot} - we use an intersection.
 * This preserves overloads on {@link HTMLElement.addEventListener}, 
 * which we need for {@link PointerEvent}.
*/
export type SVG = SVGHTMLElement & (Omit<ObPlot.Plot, 'legend'> & { legend(name: ScaleName, options?: ObPlot.LegendOptions): SVGHTMLElement | undefined; });

export type Extent = [any, any];

export interface Interactor {
  init: (svg: SVG) => Promise<void> | void;
  reset?(): void;
  publish?(extent: Extent): void;
  clause?(value: unknown): mc.SelectionClause;
}

export type PositionalScaleName = 'x' | 'y' | 'fx' | 'fy';
export type TransformScaleName = 'x' | 'y' | 'color' | 'length' | 'symbol' | 'r' | 'opacity';
export type ScaleName = PositionalScaleName | 'color' | 'length' | 'symbol' | 'r' | 'opacity';

export type ChannelName =
  ScaleName
  | 'ariaLabel'
  | 'fill'
  | 'fillOpacity'
  | 'fontSize'
  | 'geometry'
  | 'height'
  | 'href'
  | 'path'
  | 'rotate'
  | 'src'
  | 'stroke'
  | 'strokeOpacity'
  | 'strokeWidth'
  | 'text'
  | 'title'
  | 'weight'
  | 'width'
  | 'x1'
  | 'x2'
  | 'y1'
  | 'y2'
  | 'z';

export type FixedType = typeof Fixed;
export type TransientType = typeof Transient;
export type CanParam<T> = T | mc.Param<T>;