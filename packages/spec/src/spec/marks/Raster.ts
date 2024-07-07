import { ParamRef } from '../Param.js';
import { ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/**
 * A spatial interpolation method; one of:
 *
 * - *none* - do not perform interpolation (the default), maps samples to single bins
 * - *linear* - apply proportional linear interpolation across adjacent bins
 * - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram)
 * - *barycentric* - apply barycentric interpolation over the Delaunay triangulation
 * - *random-walk* - apply a random walk from each pixel, stopping when near a sample
 */
export type GridInterpolate =
  | 'none'
  | 'linear'
  | 'nearest'
  | 'barycentric'
  | 'random-walk';

/** Options for grid2d marks. */
export interface Grid2DOptions {
  /**
   * The horizontal position channel, typically bound to the *x* scale.
   * Domain values are binned into a grid with *width* horizontal bins.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position channel, typically bound to the *y* scale.
   * Domain values are binned into a grid with *height* vertical bins.
   */
  y?: ChannelValueSpec;

  /** The width (number of columns) of the grid, in actual pixels. */
  width?: number | ParamRef;

  /** The height (number of rows) of the grid, in actual pixels. */
  height?: number | ParamRef;

  /**
   * The effective screen size of a raster pixel, used to determine the height
   * and width of the raster from the frame’s dimensions; defaults to 1.
   */
  pixelSize?: number | ParamRef;

  /**
   * The bin padding, one of 1 (default) to include extra padding for the final
   * bin, or 0 to make the bins flush with the maximum domain value.
   */
  pad?: number | ParamRef;

  /**
   * The kernel density bandwidth for smoothing, in pixels.
   */
  bandwidth?: number | ParamRef;

  /**
   * The spatial interpolation method; one of:
   *
   * - *none* - do not perform interpolation (the default), maps samples to single bins
   * - *linear* - apply proportional linear interpolation across adjacent bins
   * - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram)
   * - *barycentric* - apply barycentric interpolation over the Delaunay triangulation
   * - *random-walk* - apply a random walk from each pixel, stopping when near a sample
   */
  interpolate?: GridInterpolate | null | ParamRef;
}

/** Options for the raster mark. */
export interface RasterOptions extends Grid2DOptions, Omit<MarkOptions, 'fill' | 'fillOpacity'> {
  /**
   * The [image-rendering attribute][1]; defaults to *auto* (bilinear). The
   * option may be set to *pixelated* to disable bilinear interpolation for a
   * sharper image; however, note that this is not supported in WebKit.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering
   */
  imageRendering?: string | ParamRef;

  /**
   * The fill, typically bound to the *color* scale. Can be specified as a
   * constant or a channel based on the input data.  Use the special value
   * `"density"` to map computed density values to pixel colors. Use an
   * aggregate expression to instead visualize an aggregate value per raster
   * bin. If fill is set to a constant color or to a non-aggregate field,
   * opacity will be used to convey densities. If a non-aggregate (group by)
   * field is provided, multiple rasters are created with a unique categorical
   * color per layer.
   */
  fill?: ChannelValueSpec | ParamRef;

  /**
   * The opacity, typically bound to the *opacity* scale. Can be specified as a
   * constant or a channel based on the input data. Use the special value
   * `"density"` to map computed density values to opacity. Use an aggregate
   * expression to instead visualize an aggregate value per raster bin.
   */
  fillOpacity?: ChannelValueSpec | ParamRef;
}

/** The raster mark. */
export interface Raster extends MarkData, RasterOptions {
  /**
   * A raster mark which renders a raster image from spatial samples. It
   * represents discrete samples in abstract coordinates **x** and **y**;
   * the **fill** and **fillOpacity** channels specify further abstract
   * values (_e.g._, height in a topographic map) to be spatially
   * interpolated to produce an image.
   *
   * The **x** and **y** data domains are binned into the cells ("pixels")
   * of a raster grid, typically with an aggregate function evaluated over
   * the binned data. The result can be optionally smoothed (blurred).
   *
   * To create a smoothed density heatmap, use the heatmap mark, which is
   * a raster mark with different default options.
   */
  mark: 'raster';
}

/** The heatmap mark. */
export interface Heatmap extends MarkData, RasterOptions {
  /**
   * Like raster, but with default options for accurate density estimation
   * via smoothing. The *bandwidth* (20), *interpolate* ("linear"), and
   * *pixelSize* (2) options are set to produce smoothed density heatmaps.
   */
  mark: 'heatmap';
}

/** The rasterTile mark. */
export interface RasterTile extends MarkData, RasterOptions {
  /**
   * An experimental raster mark which performs tiling and prefetching to
   * support more scalable rasters upon panning the domain. Uses a tile
   * size that matches with current width and height, and prefetches data
   * from neighboring tile segments.
   */
  mark: 'rasterTile';

  /**
   * The coordinates of the tile origin in the **x** and **y** data domains.
   * Defaults to [0, 0].
   */
  origin?: [number, number] | ParamRef;
}
