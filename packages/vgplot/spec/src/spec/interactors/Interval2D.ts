import { ParamRef } from '../Param.js';
import { BrushStyles } from './BrushStyles.js';

/** Options for 2D interval interactors. */
export interface Interval2DOptions {
  /**
   * The output selection. A clause of the form
   * `(xfield BETWEEN x1 AND x2) AND (yfield BETWEEN y1 AND y2)`
   * is added for the currently selected intervals.
   */
  as: ParamRef;
  /**
   * The name of the field (database column) over which the `x`-component
   * of the interval selection should be defined. If unspecified, the `x`
   * channel field of the first valid prior mark definition is used.
   */
  xfield?: string;
  /**
   * The name of the field (database column) over which the `y`-component
   * of the interval selection should be defined. If unspecified, the `y`
   * channel field of the first valid prior mark definition is used.
   */
  yfield?: string;
  /**
   * The size of an interative pixel (default `1`). Larger pixel sizes reduce
   * the brush resolution, which can reduce the size of pre-aggregated
   * materialized views.
   */
  pixelSize?: number;
  /**
   * A flag indicating if peer (sibling) marks are excluded when
   * cross-filtering (default `true`). If set, peer marks will not be
   * filtered by this interactor's selection in cross-filtering setups.
   */
  peers?: boolean;
  /**
   * CSS styles for the brush (SVG `rect`) element.
   */
  brush?: BrushStyles;
}

/** An intervalXY interactor. */
export interface IntervalXY extends Interval2DOptions {
  /**
   * Select a continuous 2D interval selection
   * over the `x` and `y` scale domains.
   */
  select: 'intervalXY';
}
