import {
  ChannelValueSpec, InsetOptions, MarkData, MarkOptions, MarkerOptions
} from './Marks.js';

/** Options for the tickX mark. */
export interface TickXOptions extends MarkOptions, MarkerOptions, Omit<InsetOptions, 'insetLeft' | 'insetRight'> {
  /**
   * The required horizontal position of the tick; a channel typically bound to
   * the *x* scale.
   */
  x?: ChannelValueSpec;

  /**
   * The optional vertical position of the tick; an ordinal channel typically
   * bound to the *y* scale. If not specified, the tick spans the vertical
   * extent of the frame; otherwise the *y* scale must be a *band* scale.
   *
   * If *y* represents quantitative or temporal values, use a ruleX mark
   * instead.
   */
  y?: ChannelValueSpec;
}

/** Options for the tickY mark. */
export interface TickYOptions extends MarkOptions, MarkerOptions, Omit<InsetOptions, 'insetTop' | 'insetBottom'> {
  /**
   * The required vertical position of the tick; a channel typically bound to
   * the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * The optional horizontal position of the tick; an ordinal channel typically
   * bound to the *x* scale. If not specified, the tick spans the horizontal
   * extent of the frame; otherwise the *x* scale must be a *band* scale.
   *
   * If *x* represents quantitative or temporal values, use a ruleY mark
   * instead.
   */
  x?: ChannelValueSpec;
}

/** The tickX mark. */
export interface TickX extends MarkData, TickXOptions {
  /**
   * A horizontally-positioned tickX mark (a vertical line, |). The **x**
   * channel specifies the tick’s horizontal position and defaults to identity,
   * assuming that *data* = [*x₀*, *x₁*, *x₂*, …]; the optional **y** ordinal
   * channel specifies its vertical position.
   *
   * If *y* represents quantitative or temporal values, use a ruleX mark
   * instead.
   */
  mark: 'tickX';
}

/** The tickY mark. */
export interface TickY extends MarkData, TickYOptions {
  /**
   * A vertically-positioned tickY mark (a horizontal line, —). The **y**
   * channel specifies the tick's vertical position and defaults to identity,
   * assuming that *data* = [*y₀*, *y₁*, *y₂*, …]; the optional **x** ordinal
   * channel specifies its horizontal position.
   *
   * If *x* represents quantitative or temporal values, use a ruleY mark
   * instead.
   */
  mark: 'tickY';
}
