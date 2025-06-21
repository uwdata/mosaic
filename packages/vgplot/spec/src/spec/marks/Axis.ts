import { ParamRef } from '../Param.js';
import { Interval } from '../PlotTypes.js';
import { MarkOptions } from './Marks.js';
import { RuleXOptions, RuleYOptions } from './Rule.js';
import { TextOptions } from './Text.js';
import { TickXOptions, TickYOptions } from './Tick.js';

/** The scale options used by axis and grid marks. */
interface ScaleOptions {
  /**
   * Enforces uniformity for data at regular intervals, such as integer values
   * or daily samples. The interval may be one of:
   *
   * - a named time interval such as *day* (for date intervals)
   * - a number (for number intervals), defining intervals at integer multiples of *n*
   *
   * This option sets the internal transform to the given interval’s
   * *interval*.floor function. In addition, the default **domain** will align
   * with interval boundaries.
   */
  interval?: Interval | ParamRef;

  /**
   * The desired approximate number of axis ticks, or an explicit array of tick
   * values, or an interval such as *day* or *month*.
   */
  ticks?: number | Interval | any[] | ParamRef;

  /**
   * The length of axis tick marks in pixels; negative values extend in the
   * opposite direction. Defaults to 6 for *x* and *y* axes and *color* and
   * *opacity* *ramp* legends, and 0 for *fx* and *fy* axes.
   */
  tickSize?: number | ParamRef;

  /**
   * The desired approximate spacing between adjacent axis ticks, affecting the
   * default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels
   * for *y* and *fy*.
   */
  tickSpacing?: number | ParamRef;

  /**
   * The distance between an axis tick mark and its associated text label (in
   * pixels); often defaults to 3, but may be affected by **xTickSize** and
   * **xTickRotate**.
   */
  tickPadding?: number | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  tickFormat?: string | null | ParamRef;

  /**
   * The rotation angle of axis tick labels in degrees clocksize; defaults to 0.
   */
  tickRotate?: number | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  label?: string | null | ParamRef;

  /**
   * Where to place the axis **label** relative to the plot’s frame. For
   * vertical position scales (*y* and *fy*), may be *top*, *bottom*, or
   * *center*; for horizontal position scales (*x* and *fx*), may be *left*,
   * *right*, or *center*. Defaults to *center* for ordinal scales (including
   * *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*.
   */
  labelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center' | ParamRef;

  /**
   * The axis **label** position offset (in pixels); default depends on margins
   * and orientation.
   */
  labelOffset?: number | ParamRef;

  /**
   * Whether to apply a directional arrow such as → or ↑ to the scale label. If
   * *auto* (the default), the presence of the arrow depends on whether the
   * scale is ordinal.
   */
  labelArrow?: 'auto' | 'up' | 'right' | 'down' | 'left' | 'none' | true | false | null | ParamRef;
}

/** The subset of scale options for grids. */
type GridScaleOptions = Pick<ScaleOptions, 'interval' | 'ticks' | 'tickSpacing'>;

/** The subset of scale options for axes. */
type AxisScaleOptions = Pick<ScaleOptions, 'tickSize' | 'tickPadding' | 'tickFormat' | 'tickRotate' | 'label' | 'labelOffset' | 'labelAnchor' | 'labelArrow'>;

/** Options for the grid marks. */
export interface GridOptions extends GridScaleOptions {
  /**
   * The side of the frame on which to place the axis: *top* or *bottom* for
   * horizontal axes (axisX and axisFx) and their associated vertical grids
   * (gridX and gridFx), or *left* or *right* for vertical axes (axisY and
   * axisFY) and their associated horizontal grids (gridY and gridFy).
   *
   * The default **anchor** depends on the associated scale:
   *
   * - *x* - *bottom*
   * - *y* - *left*
   * - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom*
   * - *fy* - *right* if there is a *left* *y* axis, and otherwise *right*
   *
   * For grids, the **anchor** also affects the extent of grid lines when the
   * opposite dimension is specified (**x** for gridY and **y** for gridX).
   */
  anchor?: 'top' | 'right' | 'bottom' | 'left' | ParamRef;

  /**
   * A shorthand for setting both **fill** and **stroke**; affects the stroke of
   * tick vectors and grid rules, and the fill of tick texts and axis label
   * texts; defaults to *currentColor*.
   */
  color?: MarkOptions['stroke'];

  /**
   * A shorthand for setting both **fillOpacity** and **strokeOpacity**; affects
   * the stroke opacity of tick vectors and grid rules, and the fill opacity of
   * tick texts and axis label texts; defaults to 1 for axes and 0.1 for grids.
   */
  opacity?: MarkOptions['opacity'];
}

/** Options for the axis marks. */
export interface AxisOptions extends GridOptions, MarkOptions, TextOptions, AxisScaleOptions {
  /** The tick text **stroke**, say for a *white* outline to improve legibility; defaults to null. */
  textStroke?: MarkOptions['stroke'];
  /** The tick text **strokeOpacity**; defaults to 1; has no effect unless **textStroke** is set. */
  textStrokeOpacity?: MarkOptions['strokeOpacity'];
  /** The tick text **strokeWidth**; defaults to 4; has no effect unless **textStroke** is set. */
  textStrokeWidth?: MarkOptions['strokeWidth'];
}

/** Options for the axisX and axisFx marks. */
export interface AxisXOptions extends AxisOptions, Omit<TickXOptions, 'data'> {}

/** Options for the axisY and axisFy marks. */
export interface AxisYOptions extends AxisOptions, Omit<TickYOptions, 'data'> {}

/** Options for the gridX and gridFx marks. */
export interface GridXOptions extends GridOptions, Omit<RuleXOptions, 'data' | 'interval'> {}

/** Options for the gridY and gridFy marks. */
export interface GridYOptions extends GridOptions, Omit<RuleYOptions, 'data' | 'interval'> {}

/** The axisX mark. */
export interface AxisX extends AxisXOptions {
  /**
   * An axis mark to document the visual encoding of the horizontal position
   * *x* scale, comprised of (up to) three marks: a vector for ticks, a text
   * for tick labels, and another text for an axis label. The data defaults to
   * tick values sampled from the *x* scale’s domain; if desired, use one of
   * the **ticks**, **tickSpacing**, or **interval** options.
   *
   * The **facetAnchor** option defaults to *bottom-empty* if **anchor** is
   * *bottom*, and *top-empty* if **anchor** is *top*. The default margins
   * likewise depend on **anchor** as follows; in order of **marginTop**,
   * **marginRight**, **marginBottom**, and **marginLeft**, in pixels:
   *
   * - *top* - 30, 20, 0, 20
   * - *bottom* - 0, 20, 30, 20
   *
   * For simplicity, and for consistent layout across plots, default axis margins
   * are not affected by tick labels. If tick labels are too long, either increase
   * the margin or shorten the labels: use the *k* SI-prefix tick format; use the
   * **transform** *y*-scale option to show thousands or millions; or use the
   * **textOverflow** and **lineWidth** options to clip.
   */
  mark: 'axisX';
}

/** The axisFx mark. */
export interface AxisFx extends AxisXOptions {
  /**
   * An axis mark to document the visual encoding of the horizontal facet
   * position *fx* scale, comprised of (up to) three marks: a vector for ticks,
   * a text for tick labels, and another text for an axis label. The data
   * defaults to the *fx* scale’s domain; if desired, use one of the **ticks**,
   * **tickSpacing**, or **interval** options.
   *
   * The **facetAnchor** and **frameAnchor** options defaults to **anchor**. The
   * default margins likewise depend on **anchor** as follows; in order of
   * **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**, in
   * pixels:
   *
   * - *top* - 30, 20, 0, 20
   * - *bottom* - 0, 20, 30, 20
   *
   * For simplicity, and for consistent layout across plots, default axis margins
   * are not affected by tick labels. If tick labels are too long, either increase
   * the margin or shorten the labels: use the *k* SI-prefix tick format; use the
   * **transform** *y*-scale option to show thousands or millions; or use the
   * **textOverflow** and **lineWidth** options to clip.
   */
  mark: 'axisFx';
}

/** The axisY mark. */
export interface AxisY extends AxisYOptions {
  /**
   * An axis mark to document the visual encoding of the vertical position *y*
   * scale, comprised of (up to) three marks: a vector for ticks, a text for
   * tick labels, and another text for an axis label. The data defaults to tick
   * values sampled from the *y* scale’s domain; if desired, use one of the
   * **ticks**, **tickSpacing**, or **interval** options.
   *
   * The **facetAnchor** option defaults to *right-empty* if **anchor** is
   * *right*, and *left-empty* if **anchor** is *left*. The default margins
   * likewise depend on **anchor** as follows; in order of **marginTop**,
   * **marginRight**, **marginBottom**, and **marginLeft**, in pixels:
   *
   * - *right* - 20, 40, 20, 0
   * - *left* - 20, 0, 20, 40
   *
   * For simplicity, and for consistent layout across plots, default axis
   * margins are not affected by tick labels. If tick labels are too long,
   * either increase the margin or shorten the labels: use the *k* SI-prefix
   * tick format; or use the **textOverflow** and **lineWidth** options to
   * clip.
   */
  mark: 'axisY';
}

/** The axisFy mark. */
export interface AxisFy extends AxisYOptions {
  /**
   * An axis mark to document the visual encoding of the vertical facet
   * position *fy* scale, comprised of (up to) three marks: a vector for ticks,
   * a text for tick labels, and another text for an axis label. The data
   * defaults to the *fy* scale’s domain; if desired, use one of the **ticks**,
   * **tickSpacing**, or **interval** options.
   *
   * The **facetAnchor** option defaults to *right-empty* if **anchor** is
   * *right*, and *left-empty* if **anchor** is *left*. The default margins
   * likewise depend on **anchor** as follows; in order of **marginTop**,
   * **marginRight**, **marginBottom**, and **marginLeft**, in pixels:
   *
   * - *right* - 20, 40, 20, 0
   * - *left* - 20, 0, 20, 40
   *
   * For simplicity, and for consistent layout across plots, default axis
   * margins are not affected by tick labels. If tick labels are too long,
   * either increase the margin or shorten the labels: use the *k* SI-prefix
   * tick format; or use the **textOverflow** and **lineWidth** options to
   * clip.
   */
  mark: 'axisFy';
}

/** The gridX mark. */
export interface GridX extends GridXOptions {
  /**
   * A horizontally-positioned ruleX mark (a vertical line, |) that renders a
   * grid for the *x* scale. The data defaults to tick values sampled from the
   * *x* scale’s domain; if desired, use one of the **ticks**, **tickSpacing**,
   * or **interval** options.
   */
  mark: 'gridX';
}

/** The gridFx mark. */
export interface GridFx extends GridXOptions {
  /**
   * A horizontally-positioned ruleX mark (a vertical line, |) that renders a
   * grid for the *fx* scale. The data defaults to the *fx* scale’s domain;
   * if desired, use the **ticks** option.
   */
  mark: 'gridFx';
}

/** The gridY mark. */
export interface GridY extends GridYOptions {
  /**
   * A vertically-positioned ruleY mark (a horizontal line, —) that renders a
   * grid for the *y* scale. The data defaults to tick values sampled from the
   * *y* scale’s domain; if desired, use one of the **ticks**, **tickSpacing**,
   * or **interval** options.
   */
  mark: 'gridY';
}

/** The gridFy mark. */
export interface GridFy extends GridYOptions {
  /**
   * A vertically-positioned ruleY mark (a horizontal line, —) that renders a
   * grid for the *fy* scale. The data defaults to the *fy* scale’s domain;
   * if desired, use the **ticks** option.
   */
  mark: 'gridFy';
}
