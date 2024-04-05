import { ParamRef } from '../Param.js';
import { ChannelValue, ChannelValueSpec, MarkData, MarkOptions } from './Marks.js';

/** Options for regression marks. */
interface RegressionOptions extends MarkData, MarkOptions {
  /**
   * The confidence interval in (0, 1), or 0 to hide bands; defaults to 0.95.
   */
  ci?: number | ParamRef;

  /**
   * The distance in pixels between samples of the confidence band;
   * defaults to 4.
   */
  precision?: number | ParamRef;

  /**
   * An optional ordinal channel for grouping data into (possibly stacked)
   * series, producing an independent regression for each group. If not
   * specified, it defaults to **fill** if a channel, or **stroke** if a
   * channel.
   */
  z?: ChannelValue;
}

/** Options for the regressionY mark. */
export interface RegressionYOptions extends RegressionOptions {
  /**
   * The independent variable horizontal position channel, typically bound to
   * the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …].
   */
  x?: ChannelValueSpec;

  /**
   * The dependent variable vertical position channel, typically bound to the
   * *y* scale; defaults to identity, assuming that *data* = [*y₀*, *y₁*, *y₂*,
   * …].
   */
  y?: ChannelValueSpec;
}

export interface RegressionY extends RegressionYOptions {
  /**
   * A mark that draws [linear regression][1] lines with confidence bands,
   * representing the estimated relation of a dependent variable (*y*) on an
   * independent variable (*x*).
   *
   * The linear regression line is fit using the [least squares][2] approach.
   * See Torben Jansen’s [“Linear regression with confidence bands”][3] and
   * [this StatExchange question][4] for details on the confidence interval
   * calculation.
   *
   * Multiple regressions can be produced by specifying a **z**, **fill**, or
   * **stroke** channel.
   *
   * [1]: https://en.wikipedia.org/wiki/Linear_regression
   * [2]: https://en.wikipedia.org/wiki/Least_squares
   * [3]: https://observablehq.com/@toja/linear-regression-with-confidence-bands
   * [4]: https://stats.stackexchange.com/questions/101318/understanding-shape-and-calculation-of-confidence-bands-in-linear-regression
   */
  mark: 'regressionY';
}
