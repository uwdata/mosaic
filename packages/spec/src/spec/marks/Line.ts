import {
  ChannelValue, ChannelValueSpec, CurveAutoOptions,
  MarkData, MarkOptions, MarkerOptions
} from './Marks.js';

/** Options for the line mark. */
export interface LineOptions extends MarkData, MarkOptions, MarkerOptions, CurveAutoOptions {
  /**
   * The required horizontal position channel, typically bound to the *x*
   * scale.
   */
  x?: ChannelValueSpec;

  /**
   * The required vertical position channel, typically bound to the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * An optional ordinal channel for grouping data into (possibly stacked)
   * series to be drawn as separate lines. If not specified, it defaults to
   * **fill** if a channel, or **stroke** if a channel.
   */
  z?: ChannelValue;
}

/** Options for the lineX mark. */
export interface LineXOptions extends LineOptions {
  /**
   * The vertical position channel, typically bound to the *y* scale;
   * defaults to the zero-based index of the data [0, 1, 2, …].
   */
  y?: ChannelValueSpec;
}

/** Options for the lineY mark. */
export interface LineYOptions extends LineOptions {
  /**
   * The horizontal position channel, typically bound to the *x* scale;
   * defaults to the zero-based index of the data [0, 1, 2, …].
   */
  x?: ChannelValueSpec;
}

export interface Line extends LineOptions {
  /**
   * A line mark that connects control points.
   *
   * Points along the line are connected in input order. If there are multiple
   * series via the **z**, **fill**, or **stroke** channel, series are drawn in
   * input order such that the last series is drawn on top. Typically *data* is
   * already in sorted order, such as chronological for time series; if needed,
   * consider a **sort** transform.
   *
   * If any **x** or **y** values are invalid (undefined, null, or NaN), the
   * line will be interrupted, resulting in a break that divides the line shape
   * into multiple segments. If a line segment consists of only a single point,
   * it may appear invisible unless rendered with rounded or square line caps.
   * In addition, some curves such as *cardinal-open* only render a visible
   * segment if it contains multiple points.
   *
   * Variable aesthetic channels are supported: if the **stroke** is defined as
   * a channel, the line will be broken into contiguous overlapping segments
   * when the stroke color changes; the stroke color will apply to the interval
   * spanning the current data point and the following data point. This
   * behavior also applies to the **fill**, **fillOpacity**, **strokeOpacity**,
   * **strokeWidth**, **opacity**, **href**, **title**, and **ariaLabel**
   * channels. When any of these channels are used, setting an explicit **z**
   * channel (possibly to null) is strongly recommended.
   */
  mark: 'line';
}

export interface LineX extends LineXOptions {
  /**
   * Like line, except that **x** defaults to the identity function assuming
   * that *data* = [*x₀*, *x₁*, *x₂*, …] and **y** defaults to the zero-based
   * index [0, 1, 2, …].
   */
  mark: 'lineX'
}

export interface LineY extends LineYOptions {
  /**
   * Like line, except **y** defaults to the identity function and assumes
   * that *data* = [*y₀*, *y₁*, *y₂*, …] and **x** defaults to the zero-based
   * index [0, 1, 2, …].
   */
  mark: 'lineY'
}
