import { ParamRef } from '../Param.js';
import { FrameAnchor, Interval, SymbolType } from '../PlotTypes.js';
import {
  ChannelValue, ChannelValueIntervalSpec,
  ChannelValueSpec, MarkData, MarkOptions
} from './Marks.js';

/** Options for the dot mark. */
export interface DotOptions extends MarkOptions {
  /**
   * The horizontal position channel specifying the dot’s center, typically
   * bound to the *x* scale.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position channel specifying the dot’s center, typically bound
   * to the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * An optional ordinal channel for grouping data into series.
   */
  z?: ChannelValue;

  /**
   * The radius of dots; either a channel or constant. When a number, it is
   * interpreted as a constant radius in pixels. Otherwise it is interpreted as
   * a channel, typically bound to the *r* channel, which defaults to the *sqrt*
   * type for proportional symbols. The radius defaults to 4.5 pixels when using
   * the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive
   * radius are not drawn.
   */
  r?: ChannelValueSpec | number | ParamRef;

  /**
   * The rotation angle of dots in degrees clockwise; either a channel or a
   * constant. When a number, it is interpreted as a constant; otherwise it is
   * interpreted as a channel. Defaults to 0°, pointing up.
   */
  rotate?: ChannelValue | number | ParamRef;

  /**
   * The categorical symbol; either a channel or a constant. A constant symbol
   * can be specified by a valid symbol name such as *star*, or a symbol object
   * (implementing the draw method); otherwise it is interpreted as a channel.
   * Defaults to *circle* for the **dot** mark, and *hexagon* for the
   * **hexagon** mark.
   *
   * If the **symbol** channel’s values are all symbols, symbol names, or
   * nullish, the channel is unscaled (values are interpreted literally);
   * otherwise, the channel is bound to the *symbol* scale.
   */
  symbol?: ChannelValueSpec | SymbolType | ParamRef;

  /**
   * The frame anchor specifies defaults for **x** and **y** based on the plot’s
   * frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*),
   * one of the four corners (*top-left*, *top-right*, *bottom-right*,
   * *bottom-left*), or the *middle* of the frame. For example, for dots
   * distributed horizontally at the top of the frame:
   *
   * ```js
   * Plot.dot(data, {x: "date", frameAnchor: "top"})
   * ```
   */
  frameAnchor?: FrameAnchor | ParamRef;
}

/** Options for the dotX mark. */
export interface DotXOptions extends Omit<DotOptions, "y"> {
  /**
   * The vertical position of the dot’s center, typically bound to the *y*
   * scale.
   */
  y?: ChannelValueIntervalSpec;

  /**
   * An interval (such as *day* or a number), to transform **y** values to the
   * middle of the interval.
   */
  interval?: Interval | ParamRef;
}

/** Options for the dotY mark. */
export interface DotYOptions extends Omit<DotOptions, "x"> {
  /**
   * The horizontal position of the dot’s center, typically bound to the *x*
   * scale.
   */
  x?: ChannelValueIntervalSpec;

  /**
   * An interval (such as *day* or a number), to transform **x** values to the
   * middle of the interval.
   */
  interval?: Interval | ParamRef;
}

/** The dot mark. */
export interface Dot extends MarkData, DotOptions {
  /**
   * A dot mark that draws circles, or other symbols, as in a scatterplot.
   *
   * If either **x** or **y** is not specified, the default is determined by the
   * **frameAnchor** option. If none of **x**, **y**, and **frameAnchor** are
   * specified, *data* is assumed to be an array of pairs [[*x₀*, *y₀*], [*x₁*,
   * *y₁*], [*x₂*, *y₂*], …] such that **x** = [*x₀*, *x₁*, *x₂*, …] and **y** =
   * [*y₀*, *y₁*, *y₂*, …].
   *
   * Dots are sorted by descending radius **r** by default to mitigate
   * overplotting; set the **sort** option to null to draw them in input order.
   */
  mark: 'dot';
}

/** The dotX mark. */
export interface DotX extends MarkData, DotXOptions {
  /**
   * Like dot, except that **x** defaults to the identity function, assuming that
   * *data* = [*x₀*, *x₁*, *x₂*, …].
   *
   * If an **interval** is specified, such as *day*, **y** is transformed to the
   * middle of the interval.
   */
  mark: 'dotX';
}

/** The dotY mark. */
export interface DotY extends MarkData, DotYOptions {
  /**
   * Like dot, except that **y** defaults to the identity function, assuming that
   * *data* = [*y₀*, *y₁*, *y₂*, …].
   *
   * If an **interval** is specified, such as *day*, **x** is transformed to the
   * middle of the interval.
   */
  mark: 'dotY';
}

/** The circle mark. */
export interface Circle extends MarkData, Exclude<DotOptions, 'symbol'> {
  /** Like dot, except that the **symbol** option is set to *circle*. */
  mark: 'circle';
}

/** The hexagon mark. */
export interface Hexagon extends MarkData, Exclude<DotOptions, 'symbol'> {
  /** Like dot, except that the **symbol** option is set to *hexagon*. */
  mark: 'hexagon';
}
