import { ParamRef } from '../Param.js';
import { Interval } from '../PlotTypes.js';
import { ChannelValueIntervalSpec, ChannelValueSpec, InsetOptions, MarkDataOptional, MarkOptions, MarkerOptions } from './Marks.js';

/** Options for the ruleX and ruleY marks. */
interface RuleOptions extends MarkDataOptional, MarkOptions, MarkerOptions {
  /**
   * How to convert a continuous value (**y** for ruleX, or **x** for ruleY)
   * into an interval (**y1** and **y2** for ruleX, or **x1** and **x2** for
   * ruleY); one of:
   *
   * - a named time interval such as *day* (for date intervals)
   * - a number (for number intervals), defining intervals at integer multiples of *n*
   */
  interval?: Interval | ParamRef;
}

/** Options for the ruleX mark. */
export interface RuleXOptions extends RuleOptions, Omit<InsetOptions, 'insetLeft' | 'insetRight'> {
  /**
   * The horizontal position of the tick; an optional channel bound to the *x*
   * scale. If not specified, the rule will be horizontally centered in the
   * plot’s frame.
   */
  x?: ChannelValueSpec;

  /**
   * Shorthand for specifying both the primary and secondary vertical position
   * of the tick as the bounds of the containing interval; can only be used in
   * conjunction with the **interval** option.
   */
  y?: ChannelValueIntervalSpec;

  /**
   * The primary (starting, often bottom) vertical position of the tick; a
   * channel bound to the *y* scale.
   *
   * If *y* represents ordinal values, use a tickX mark instead.
   */
  y1?: ChannelValueSpec;

  /**
   * The secondary (ending, often top) vertical position of the tick; a channel
   * bound to the *y* scale.
   *
   * If *y* represents ordinal values, use a tickX mark instead.
   */
  y2?: ChannelValueSpec;
}

/** Options for the ruleY mark. */
export interface RuleYOptions extends RuleOptions, Omit<InsetOptions, "insetTop" | "insetBottom"> {
  /**
   * Shorthand for specifying both the primary and secondary horizontal position
   * of the tick as the bounds of the containing interval; can only be used in
   * conjunction with the **interval** option.
   */
  x?: ChannelValueIntervalSpec;

  /**
   * The primary (starting, often left) horizontal position of the tick; a
   * channel bound to the *x* scale.
   *
   * If *x* represents ordinal values, use a tickY mark instead.
   */
  x1?: ChannelValueSpec;

  /**
   * The secondary (ending, often right) horizontal position of the tick; a
   * channel bound to the *x* scale.
   *
   * If *x* represents ordinal values, use a tickY mark instead.
   */
  x2?: ChannelValueSpec;

  /**
   * The vertical position of the tick; an optional channel bound to the *y*
   * scale. If not specified, the rule will be vertically centered in the plot’s
   * frame.
   */
  y?: ChannelValueSpec;
}

export interface RuleX extends RuleXOptions {
  /**
   * A horizontally-positioned ruleX mark (a vertical line, |). The **x**
   * channel specifies the rule’s horizontal position and defaults to identity,
   * assuming that *data* = [*x₀*, *x₁*, *x₂*, …]; the optional **y1** and
   * **y2** channels specify its vertical extent.
   *
   * The ruleX mark is often used to highlight specific *x* values.
   * If *y* represents ordinal values, use a tickX mark instead.
   */
  mark: 'ruleX';
}

export interface RuleY extends RuleXOptions {
  /**
   * A vertically-positioned ruleY mark (a horizontal line, —). The **y**
   * channel specifies the rule's vertical position and defaults to identity,
   * assuming that *data* = [*y₀*, *y₁*, *y₂*, …]; the optional **x1** and
   * **x2** channels specify its horizontal extent.
   *
   * The ruleY mark is often used to highlight specific *y* values.
   * If *x* represents ordinal values, use a tickY mark instead.
   */
  mark: 'ruleY';
}
