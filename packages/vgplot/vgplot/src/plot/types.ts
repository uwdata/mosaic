import type { Param } from '@uwdata/mosaic-core';
import type { Fixed, Plot } from '@uwdata/mosaic-plot';
export type { Plot } from '@uwdata/mosaic-plot';

/** 
 * TODO @dangotbanned: Add docs to this and probably rename it.
 * 
 * (Most of the API depends on this guy)
 */
export type Callback = (plot: Plot) => void;
export type MarkType = 'text' | 'area' | 'areaX' | 'areaY' | 'arrow' | 'axisX' | 'axisY' | 'axisFx' | 'axisFy' | 'gridX' | 'gridY' | 'gridFx' | 'gridFy' | 'barX' | 'barY' | 'cell' | 'cellX' | 'cellY' | 'contour' | 'delaunayLink' | 'delaunayMesh' | 'hull' | 'voronoi' | 'voronoiMesh' | 'denseLine' | 'density' | 'densityX' | 'densityY' | 'dot' | 'dotX' | 'dotY' | 'circle' | 'hexagon' | 'errorbarX' | 'errorbarY' | 'frame' | 'geo' | 'graticule' | 'sphere' | 'hexbin' | 'hexgrid' | 'image' | 'line' | 'lineX' | 'lineY' | 'link' | 'raster' | 'heatmap' | 'rasterTile' | 'rect' | 'rectX' | 'rectY' | 'regressionY' | 'ruleX' | 'ruleY' | 'textX' | 'textY' | 'tickX' | 'tickY' | 'vector' | 'vectorX' | 'vectorY' | 'spike' | 'waffleX' | 'waffleY';

/**Rename a single property in `T`. */
export type Rename<T, From extends keyof T, To extends string> = { [P in keyof T as P extends From ? To : P]: T[P] };

/**Make `K` properties in `T` required. */
export type Require<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: T[P] };

/**Select properties from `T` whose values are assignable to `U`.*/
export type PickValues<T, U> = Pick<T, { [P in keyof T]: T[P] extends U ? P : never }[keyof T] & U>;

export type Primitive = number | string | boolean | null;
export type FixedType = typeof Fixed;
export type Value = Param<unknown> | Primitive | Primitive[] | FixedType;
export type CanParam<T extends Primitive | Primitive[]> = T | Param<T>;