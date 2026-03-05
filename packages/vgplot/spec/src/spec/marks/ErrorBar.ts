import { ParamRef } from '../Param.js';
import {
  ChannelValue, ChannelValueSpec, MarkData, MarkOptions, MarkerOptions
} from './Marks.js';

/** Options for errorbar marks. */
interface ErrorBarOptions extends MarkOptions, MarkerOptions {
  /**
   * The confidence interval in (0, 1); defaults to 0.95.
   */
  ci?: number | ParamRef;

  /**
   * An optional ordinal channel for grouping data, producing an independent
   * error bar for each group. If not specified, it defaults to **stroke** if
   * a channel.
   */
  z?: ChannelValue;
}

/** Options for the errorbarX mark. */
export interface ErrorBarXOptions extends ErrorBarOptions {
  /**
   * The dependent variable horizontal position channel, typically bound to the
   * *x* scale.
   */
  x: ChannelValueSpec;

  /**
   * The independent variable vertical position channel, typically bound to
   * the *y* scale; defaults to the zero-based index of the data [0, 1, 2, …].
   */
  y?: ChannelValueSpec;
}

/** The errorbarX mark. */
export interface ErrorBarX extends MarkData, ErrorBarXOptions {
  /**
   * A mark that draws error bars for a calculated parametric confidence
   * interval for a dependent variable (*x*), potentially grouped by an
   * independent variable (*y*).
   *
   * This mark aggregates raw values to produce a [parametric confidence
   * interval][1] of the mean, assuming a normal distribution. To instead
   * visualize pre-computed interval values or custom aggregations, use
   * a **ruleY** mark with specified **x1** and **x2** channels.
   *
   * Multiple error bars can be produced by specifying a **z** or **stroke**
   * channel. Set the **marker** option to `'tick'` to add small perpendicular
   * lines at the start and end of the error interval.
   *
   * [1]: https://en.wikipedia.org/wiki/Normal_distribution#Confidence_intervals
   */
  mark: 'errorbarX';
}

/** Options for the errorbarY mark. */
export interface ErrorBarYOptions extends ErrorBarOptions {
  /**
   * The independent variable horizontal position channel, typically bound to
   * the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …].
   */
  x?: ChannelValueSpec;

  /**
   * The dependent variable vertical position channel, typically bound to the
   * *y* scale.
   */
  y: ChannelValueSpec;
}

/** The errorbarY mark. */
export interface ErrorBarY extends MarkData, ErrorBarYOptions {
  /**
   * A mark that draws error bars for a calculated parametric confidence
   * interval for a dependent variable (*y*), potentially grouped by an
   * independent variable (*x*).
   *
   * This mark aggregates raw values to produce a [parametric confidence
   * interval][1] of the mean, assuming a normal distribution. To instead
   * visualize pre-computed interval values or custom aggregations, use
   * a **ruleX** mark with specified **y1** and **y2** channels.
   *
   * Multiple error bars can be produced by specifying a **z** or **stroke**
   * channel. Set the **marker** option to `'tick'` to add small perpendicular
   * lines at the start and end of the error interval.
   *
   * [1]: https://en.wikipedia.org/wiki/Normal_distribution#Confidence_intervals
   */
  mark: 'errorbarY';
}
