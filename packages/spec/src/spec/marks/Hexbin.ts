import { ParamRef } from '../Param.js';
import { DotOptions } from './Dot.js';
import { ChannelValue, MarkData, TextStyles } from './Marks.js';

export interface HexbinOptions extends DotOptions, TextStyles {
  /**
   * The basic mark type to use for hex-binned values.
   * Defaults to a hexagon mark; dot and text marks are also supported.
   */
  type?: 'dot' | 'circle' | 'hexagon' | 'text' | ParamRef;

  /**
   * The distance between centers of neighboring hexagons, in pixels; defaults
   * to 20. If also using a hexgrid mark, use matching **binWidth** values.
   */
  binWidth?: number | ParamRef;

  /**
   * How to subdivide bins. If not specified, defaults to the *fill* channel,
   * if any, or the *stroke* channel, if any. If null, bins will not be
   * subdivided.
   */
  z?: ChannelValue;
}

/** The hexbin mark. */
export interface Hexbin extends MarkData, HexbinOptions {
  /**
   * A hexbin mark that bins **x** and **y** data into a hexagonal grid and
   * visualizes aggregate functions per bin (e.g., count for binned density).
   * Aggregate functions can be used for fill, stroke, or r (radius) options.
   */
  mark: 'hexbin';
}
