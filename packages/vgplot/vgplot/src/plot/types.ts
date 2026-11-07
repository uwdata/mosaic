import type { Plot } from '@uwdata/mosaic-plot';
export type { Plot } from '@uwdata/mosaic-plot';

/** 
 * TODO @dangotbanned: Add docs to this and probably rename it.
 * 
 * (Most of the API depends on this guy)
 */
export type Callback = (plot: Plot) => void;
export type MarkType = 'text' | 'area' | 'areaX' | 'areaY' | 'arrow' | 'axisX' | 'axisY' | 'axisFx' | 'axisFy' | 'gridX' | 'gridY' | 'gridFx' | 'gridFy' | 'barX' | 'barY' | 'cell' | 'cellX' | 'cellY' | 'contour' | 'delaunayLink' | 'delaunayMesh' | 'hull' | 'voronoi' | 'voronoiMesh' | 'denseLine' | 'density' | 'densityX' | 'densityY' | 'dot' | 'dotX' | 'dotY' | 'circle' | 'hexagon' | 'errorbarX' | 'errorbarY' | 'frame' | 'geo' | 'graticule' | 'sphere' | 'hexbin' | 'hexgrid' | 'image' | 'line' | 'lineX' | 'lineY' | 'link' | 'raster' | 'heatmap' | 'rasterTile' | 'rect' | 'rectX' | 'rectY' | 'regressionY' | 'ruleX' | 'ruleY' | 'textX' | 'textY' | 'tickX' | 'tickY' | 'vector' | 'vectorX' | 'vectorY' | 'spike' | 'waffleX' | 'waffleY';