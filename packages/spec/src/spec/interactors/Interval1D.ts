import { ParamRef } from '../Param.js';
import { BrushStyles } from './BrushStyles.js';

/** Options for 1D interval interactors. */
export interface Interval1DOptions {
  /**
   * The output selection. A clause of the form `field BETWEEN lo AND hi`
   * is added for the currently selected interval [lo, hi].
   */
  as: ParamRef;
  /**
   * The name of the field (database column) over which the interval
   * selection should be defined. If unspecified, the  channel field of the
   * first valid prior mark definition is used.
   */
  field?: string;
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

/** An intervalX interactor. */
export interface IntervalX extends Interval1DOptions {
  /** Select a continuous 1D interval selection over the `x` scale domain. */
  select: 'intervalX';
}

/** An intervalY interactor. */
export interface IntervalY extends Interval1DOptions {
  /** Select a continuous 1D interval selection over the `y` scale domain. */
  select: 'intervalY';
}
