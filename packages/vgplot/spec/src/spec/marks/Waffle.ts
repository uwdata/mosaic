import { ParamRef } from '../Param.js';
import { BarXOptions, BarYOptions } from './Bar.js';
import { MarkData } from './Marks.js';

/** Options for the waffleX and waffleY mark. */
export interface WaffleOptions {
  /** The number of cells per row or column; defaults to undefined for automatic. */
  multiple?: number | ParamRef;
  /** The quantity each cell represents; defaults to 1. */
  unit?: number | ParamRef;
  /** The gap in pixels between cells; defaults to 1. */
  gap?: number | ParamRef;
  /** If true, round to integers to avoid partial cells. */
  round?: boolean | ParamRef;
}

/** The waffleX mark. */
export interface WaffleX extends MarkData, BarXOptions, WaffleOptions {
  /**
   * A horizontal waffle mark. The required *x* values should be quantitative,
   * and the optional *y* values should be ordinal.
   *
   * If neither **x1** nor **x2** nor **interval** is specified, an implicit
   * stackX transform is applied and **x** defaults to the identity function,
   * assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise if an **interval**
   * is specified, then **x1** and **x2** are derived from **x**, representing
   * the lower and upper bound of the containing interval, respectively.
   * Otherwise, if only one of **x1** or **x2** is specified, the other
   * defaults to **x**, which defaults to zero.
   *
   * The optional **y** ordinal channel specifies the vertical position; it is
   * typically bound to the *y* scale, which must be a *band* scale. If the
   * **y** channel is not specified, the bar will span the vertical extent of
   * the plot’s frame. Because a waffle represents a discrete number of square
   * cells, it may not use all of the available bandwidth.
   */
  mark: 'waffleX';
}

/** The waffleY mark. */
export interface WaffleY extends MarkData, BarYOptions, WaffleOptions {
  /**
   * A vertical waffle mark. The required *y* values should be quantitative,
   * and the optional *x* values should be ordinal.
   *
   * If neither **y1** nor **y2** nor **interval** is specified, an implicit
   * stackY transform is applied and **y** defaults to the identity function,
   * assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise if an **interval**
   * is specified, then **y1** and **y2** are derived from **y**, representing
   * the lower and upper bound of the containing interval, respectively.
   * Otherwise, if only one of **y1** or **y2** is specified, the other
   * defaults to **y**, which defaults to zero.
   *
   * The optional **x** ordinal channel specifies the horizontal position; it
   * is typically bound to the *x* scale, which must be a *band* scale. If the
   * **x** channel is not specified, the bar will span the horizontal extent of
   * the plot’s frame. Because a waffle represents a discrete number of square
   * cells, it may not use all of the available bandwidth.
   */
  mark: 'waffleY';
}
