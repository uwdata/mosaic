import { ParamRef } from '../Param.js';
import { FrameAnchor, Interval } from '../PlotTypes.js';
import {
  ChannelValue, ChannelValueIntervalSpec, ChannelValueSpec,
  MarkDataOptional, MarkOptions, TextStyles
} from './Marks.js';

/** Options for the text mark. */
export interface TextOptions extends MarkOptions, TextStyles {
  /**
   * The horizontal position channel specifying the text’s anchor point,
   * typically bound to the *x* scale.
   */
  x?: ChannelValueSpec;

  /**
   * The vertical position channel specifying the text’s anchor point, typically
   * bound to the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * An optional ordinal channel for grouping data into series.
   */
  z?: ChannelValue;

  /**
   * The text contents channel, possibly with line breaks (\n, \r\n, or \r). If
   * not specified, defaults to the zero-based index [0, 1, 2, …].
   */
  text?: ChannelValue;

  /**
   * The frame anchor specifies defaults for **x** and **y**, along with
   * **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one
   * of the four sides (*top*, *right*, *bottom*, *left*), one of the four
   * corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the
   * *middle* of the frame.
   */
  frameAnchor?: FrameAnchor | ParamRef;

  /**
   * The line anchor controls how text is aligned (typically vertically)
   * relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If
   * the frame anchor is *top*, *top-left*, or *top-right*, the default line
   * anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or
   * *bottom-left*, the default is *bottom*; otherwise it is *middle*.
   */
  lineAnchor?: 'top' | 'middle' | 'bottom' | ParamRef;

  /**
   * The rotation angle in degrees clockwise; a constant or a channel; defaults
   * to 0°. When a number, it is interpreted as a constant; otherwise it is
   * interpreted as a channel.
   */
  rotate?: ChannelValue | ParamRef;
}

/** Options for the textX mark. */
export interface TextXOptions extends Omit<TextOptions, 'y'> {
  /**
   * The vertical position of the text’s anchor point, typically bound to the
   * *y* scale.
   */
  y?: ChannelValueIntervalSpec;

  /**
   * An interval (such as *day* or a number), to transform **y** values to the
   * middle of the interval.
   */
  interval?: Interval | ParamRef;
}

/** Options for the textY mark. */
export interface TextYOptions extends Omit<TextOptions, 'x'> {
  /**
   * The horizontal position of the text’s anchor point, typically bound to the
   * *x* scale.
   */
  x?: ChannelValueIntervalSpec;

  /**
   * An interval (such as *day* or a number), to transform **x** values to the
   * middle of the interval.
   */
  interval?: Interval;
}

/** The text mark. */
export interface Text extends MarkDataOptional, TextOptions {
  /**
   * A text mark. The **text** channel specifies the textual contents of the
   * mark, which may be preformatted with line breaks (\n, \r\n, or \r), or
   * wrapped or clipped using the **lineWidth** and **textOverflow** options.
   *
   * If **text** contains numbers or dates, a default formatter will be
   * applied, and the **fontVariant** will default to *tabular-nums* instead
   * of *normal*. If **text** is not specified, it defaults to the identity
   * function for primitive data (such as numbers, dates, and strings), and to
   * the zero-based index [0, 1, 2, …] for objects (so that something
   * identifying is visible by default).
   *
   * If either **x** or **y** is not specified, the default is determined by
   * the **frameAnchor** option.
   */
  mark: 'text';
}

/** The textX mark. */
export interface TextX extends MarkDataOptional, TextXOptions {
  /**
   * Like text, but **x** defaults to the identity function, assuming that
   * *data* = [*x₀*, *x₁*, *x₂*, …]. If an **interval** is specified, such as
   * *day*, **y** is transformed to the middle of the interval.
   */
  mark: 'textX';
}

/** The textY mark. */
export interface TextY extends MarkDataOptional, TextYOptions {
  /**
   * Like text, but **y** defaults to the identity function, assuming that
   * *data* = [*y₀*, *y₁*, *y₂*, …]. If an **interval** is specified, such as
   * *day*, **x** is transformed to the middle of the interval.
   */
  mark: 'textY';
}
