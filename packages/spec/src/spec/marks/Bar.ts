import { ParamRef } from '../Param.js';
import { Interval } from '../PlotTypes.js';
import { ChannelValueIntervalSpec, ChannelValueSpec, InsetOptions, MarkData, MarkOptions, StackOptions } from './Marks.js';
import { RectCornerOptions } from './Rect.js';

/** Options for the barX and barY marks. */
interface BarOptions extends MarkOptions, InsetOptions, RectCornerOptions, StackOptions {
  /**
   * How to convert a continuous value (**x** for barX, or **y** for barY) into
   * an interval (**x1** and **x2** for barX, or **y1** and **y2** for barY);
   * one of:
   *
   * - a named time interval such as *day* (for date intervals)
   * - a number (for number intervals), defining intervals at integer multiples of *n*
   *
   * Setting this option disables the implicit stack transform (stackX for barX,
   * or stackY for barY).
   */
  interval?: Interval | ParamRef;
}

/** Options for the barX mark. */
export interface BarXOptions extends BarOptions {
  /**
   * The horizontal position (or length/width) channel, typically bound to the
   * *x* scale.
   *
   * If neither **x1** nor **x2** nor **interval** is specified, an implicit
   * stackX transform is applied and **x** defaults to the identity function,
   * assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise if an **interval**
   * is specified, then **x1** and **x2** are derived from **x**, representing
   * the lower and upper bound of the containing interval, respectively.
   * Otherwise, if only one of **x1** or **x2** is specified, the other
   * defaults to **x**, which defaults to zero.
   */
  x?: ChannelValueIntervalSpec;

  /**
   * The required primary (starting, often left) horizontal position channel,
   * typically bound to the *x* scale. Setting this option disables the
   * implicit stackX transform.
   *
   * If *x* represents ordinal values, use a cell mark instead.
   */
  x1?: ChannelValueSpec;

  /**
   * The required secondary (ending, often right) horizontal position channel,
   * typically bound to the *x* scale. Setting this option disables the
   * implicit stackX transform.
   *
   * If *x* represents ordinal values, use a cell mark instead.
   */
  x2?: ChannelValueSpec;

  /**
   * The optional vertical position of the bar; a ordinal channel typically
   * bound to the *y* scale. If not specified, the bar spans the vertical
   * extent of the frame; otherwise the *y* scale must be a *band* scale.
   *
   * If *y* represents quantitative or temporal values, use a rectX mark
   * instead.
   */
  y?: ChannelValueSpec;
}

/** Options for the barY mark. */
export interface BarYOptions extends BarOptions {
  /**
   * The vertical position (or length/height) channel, typically bound to the
   * *y* scale.
   *
   * If neither **y1** nor **y2** nor **interval** is specified, an implicit
   * stackY transform is applied and **y** defaults to the identity function,
   * assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise if an **interval**
   * is specified, then **y1** and **y2** are derived from **y**, representing
   * the lower and upper bound of the containing interval, respectively.
   * Otherwise, if only one of **y1** or **y2** is specified, the other
   * defaults to **y**, which defaults to zero.
   */
  y?: ChannelValueIntervalSpec;

  /**
   * The required primary (starting, often bottom) vertical position channel,
   * typically bound to the *y* scale. Setting this option disables the
   * implicit stackY transform.
   *
   * If *y* represents ordinal values, use a cell mark instead.
   */
  y1?: ChannelValueSpec;

  /**
   * The required secondary (ending, often top) horizontal position channel,
   * typically bound to the *y* scale. Setting this option disables the
   * implicit stackY transform.
   *
   * If *y* represents ordinal values, use a cell mark instead.
   */
  y2?: ChannelValueSpec;

  /**
   * The optional horizontal position of the bar; a ordinal channel typically
   * bound to the *x* scale. If not specified, the bar spans the horizontal
   * extent of the frame; otherwise the *x* scale must be a *band* scale.
   *
   * If *x* represents quantitative or temporal values, use a rectY mark
   * instead.
   */
  x?: ChannelValueSpec;
}

/** The barX mark. */
export interface BarX extends MarkData, BarXOptions {
  /**
   * A horizontal bar mark. The required *x* values should be quantitative or
   * temporal, and the optional *y* values should be ordinal.
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
   * the plot’s frame.
   *
   * If *y* is quantitative, use the rectX mark instead.
   * If *x* is ordinal, use the cell mark instead.
   */
  mark: 'barX';
}

/** The barY mark. */
export interface BarY extends MarkData, BarYOptions {
  /**
   * A vertical bar mark. The required *y* values should be quantitative or
   * temporal, and the optional *x* values should be ordinal.
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
   * the plot’s frame.
   *
   * If *x* is quantitative, use the rectY mark instead.
   * If *y* is ordinal, use the cell mark instead.
   */
  mark: 'barY';
}
