import { CSSStyles } from './CSSStyles.js';
import { ParamRef } from './Param.js';
import {
  ColorScaleType, ColorScheme, ContinuousScaleType, DiscreteScaleType,
  Fixed, Interpolate, Interval, PositionScaleType, ProjectionName
} from './PlotTypes.js';

export type LabelArrow =
  | 'auto'
  | 'up'
  | 'right'
  | 'down'
  | 'left'
  | 'none'
  | true
  | false
  | null;

/** Plot attributes. */
export interface PlotAttributes {
  /**
   * A unique name for the plot. The name is used by standalone legend
   * components to to lookup the plot and access scale mappings.
   */
  name?: string;

  /**
   * The outer width of the plot in pixels, including margins. Defaults to 640.
   * On Observable, this can be set to the built-in [width][1] for full-width
   * responsive plots. Note: the default style has a max-width of 100%; the plot
   * will automatically shrink to fit even when a fixed width is specified.
   *
   * [1]: https://github.com/observablehq/stdlib/blob/main/README.md#width
   */
  width?: number | ParamRef;

  /**
   * The outer height of the plot in pixels, including margins. The default
   * depends on the plot’s scales, and the plot’s width if an aspectRatio is
   * specified. For example, if the *y* scale is linear and there is no *fy*
   * scale, it might be 396.
   */
  height?: number | ParamRef;

  /**
   * The desired aspect ratio of the *x* and *y* scales, affecting the default
   * height. Given an aspect ratio of *dx* / *dy*, and assuming that the *x* and
   * *y* scales represent equivalent units (say, degrees Celsius or meters),
   * computes a default height such that *dx* pixels along *x* represents the
   * same variation as *dy* pixels along *y*. Note: when faceting, set the *fx*
   * and *fy* scales’ **round** option to false for an exact aspect ratio.
   */
  aspectRatio?: number | boolean | null | ParamRef;

  /**
   * Shorthand to set the same default for all four margins: **marginTop**,
   * **marginRight**, **marginBottom**, and **marginLeft**. Otherwise, the
   * default margins depend on the maximum margins of the plot’s marks. While
   * most marks default to zero margins (because they are drawn inside the chart
   * area), Plot’s axis marks have non-zero default margins.
   */
  margin?: number | ParamRef;

  /**
   * The top margin; the distance in pixels between the top edges of the inner
   * and outer plot area. Defaults to the maximum top margin of the plot’s
   * marks.
   */
  marginTop?: number | ParamRef;

  /**
   * The right margin; the distance in pixels between the right edges of the
   * inner and outer plot area. Defaults to the maximum right margin of the
   * plot’s marks.
   */
  marginRight?: number | ParamRef;

  /**
   * The bottom margin; the distance in pixels between the bottom edges of the
   * inner and outer plot area. Defaults to the maximum bottom margin of the
   * plot’s marks.
   */
  marginBottom?: number | ParamRef;

  /**
   * The left margin; the distance in pixels between the left edges of the inner
   * and outer plot area. Defaults to the maximum left margin of the plot’s
   * marks.
   */
  marginLeft?: number | ParamRef;

  /**
   * A shorthand object notation for setting multiple margin values.
   * The object keys are margin names (top, right, etc).
   */
  margins?: {
    top?: number | ParamRef;
    right?: number | ParamRef;
    bottom?: number | ParamRef;
    left?: number | ParamRef;
  };

  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  inset?: number | ParamRef;

  /**
   * Custom styles to override Plot’s defaults. Styles may be specified either
   * as a string of inline styles (*e.g.*, `"color: red;"`, in the same fashion
   * as assigning [*element*.style][1]) or an object of properties (*e.g.*,
   * `{color: "red"}`, in the same fashion as assigning [*element*.style
   * properties][2]). Note that unitless numbers ([quirky lengths][3]) such as
   * `{padding: 20}` may not supported by some browsers; you should instead
   * specify a string with units such as `{padding: "20px"}`. By default, the
   * returned plot has a max-width of 100%, and the system-ui font. Plot’s marks
   * and axes default to [currentColor][4], meaning that they will inherit the
   * surrounding content’s color.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style
   * [2]: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration
   * [3]: https://www.w3.org/TR/css-values-4/#deprecated-quirky-length
   * [4]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword
   */
  style?: string | CSSStyles | null | ParamRef;

  /**
   * How to distribute unused space in the **range** for *point* and *band*
   * scales. A number in [0, 1], such as:
   *
   * - 0 - use the start of the range, putting unused space at the end
   * - 0.5 (default) - use the middle, distributing unused space evenly
   * - 1 use the end, putting unused space at the start
   *
   * For ordinal position scales only.
   */
  align?: number | ParamRef;

  /**
   * For *band* scales, how much of the **range** to reserve to separate
   * adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of
   * inset for the first and last value as a proportion of the bandwidth;
   * defaults to 0.5 (50%).
   *
   * For ordinal position scales only.
   */
  padding?: number | ParamRef;

  /**
   * The side of the frame on which to place the implicit axis: *top* or
   * *bottom* for *x* or *fx*, or *left* or *right* for *y* or *fy*. The default
   * depends on the scale:
   *
   * - *x* - *bottom*
   * - *y* - *left*
   * - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom*
   * - *fy* - *right* if there is a *left* *y* axis, and otherwise *right*
   *
   * If *both*, an implicit axis will be rendered on both sides of the plot
   * (*top* and *bottom* for *x* or *fx*, or *left* and *right* for *y* or
   * *fy*). If null, the implicit axis is suppressed.
   *
   * For position axes only.
   */
  axis?: 'top' | 'right' | 'bottom' | 'left' | 'both' | boolean | null | ParamRef;

  /**
   * Whether to show a grid aligned with the scale’s ticks. If true, show a grid
   * with the currentColor stroke; if a string, show a grid with the specified
   * stroke color; if an approximate number of ticks, an interval, or an array
   * of tick values, show corresponding grid lines. See also the grid mark.
   *
   * For axes only.
   */
  grid?: boolean | string | ParamRef;

  /**
   * The [aria-label attribute][1] on the SVG root.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label
   */
  ariaLabel?: string | null;

  /**
   * The [aria-description attribute][1] on the SVG root.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description
   */
  ariaDescription?: string | null;

  /** The default clip for all marks. */
  clip?: 'frame' | 'sphere' | boolean | null | ParamRef;


  // x scale attributes

  /**
   * The *x* scale type, affecting how the scale encodes abstract data, say by
   * applying a mathematical transformation. If null, the scale is disabled.
   *
   * For quantitative data (numbers), defaults to *linear*; for temporal data
   * (dates), defaults to *utc*; for ordinal data (strings or booleans),
   * defaults to *point* for position scales, *categorical* for color scales,
   * and otherwise *ordinal*. However, the radius scale defaults to *sqrt*, and
   * the length and opacity scales default to *linear*; these scales are
   * intended for quantitative data. The plot’s marks may also impose a scale
   * type; for example, the barY mark requires that *x* is a *band* scale.
   */
  xScale?: PositionScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   *
   * Linear scales have a default domain of [0, 1]. Log scales have a default
   * domain of [1, 10] and cannot include zero. Radius scales have a default
   * domain from 0 to the median first quartile of associated channels. Length
   * have a default domain from 0 to the median median of associated channels.
   * Opacity scales have a default domain from 0 to the maximum value of
   * associated channels.
   */
  xDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and for position scales, the plot’s
   * dimensions. For continuous data (numbers and dates), and for ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale.
   */
  xRange?: any[] | Fixed | ParamRef;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  xNice?: boolean | number | Interval | ParamRef;

  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  xInset?: number | ParamRef;

  /**
   * Insets the right edge by the specified number of pixels. A positive value
   * insets towards the left edge (reducing effective area), while a negative
   * value insets away from the left edge (increasing it).
   */
  xInsetRight?: number | ParamRef;

  /**
   * Insets the left edge by the specified number of pixels. A positive value
   * insets towards the right edge (reducing effective area), while a negative
   * value insets away from the right edge (increasing it).
   */
  xInsetLeft?: number | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  xClamp?: boolean | ParamRef;

  /**
   * If true, round the output value to the nearest integer (pixel); useful for
   * crisp edges when rendering.
   *
   * For position scales only.
   */
  xRound?: boolean | ParamRef;

  /**
   * How to distribute unused space in the **range** for *point* and *band*
   * scales. A number in [0, 1], such as:
   *
   * - 0 - use the start of the range, putting unused space at the end
   * - 0.5 (default) - use the middle, distributing unused space evenly
   * - 1 use the end, putting unused space at the start
   *
   * For ordinal position scales only.
   */
  xAlign?: number | ParamRef;

  /**
   * For *band* scales, how much of the **range** to reserve to separate
   * adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of
   * inset for the first and last value as a proportion of the bandwidth;
   * defaults to 0.5 (50%).
   *
   * For ordinal position scales only.
   */
  xPadding?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to separate
   * adjacent bands.
   */
  xPaddingInner?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to inset first and
   * last bands.
   */
  xPaddingOuter?: number | ParamRef;

  /**
   * The side of the frame on which to place the implicit axis: *top* or
   * *bottom* for *x*. Defaults to *bottom* for an *x* scale.
   *
   * If *both*, an implicit axis will be rendered on both sides of the plot
   * (*top* and *bottom* for *x*). If null, the implicit axis is suppressed.
   */
  xAxis?: 'top' | 'bottom' | 'both' | boolean | null | ParamRef;

  /**
   * The desired approximate number of axis ticks, or an explicit array of tick
   * values, or an interval such as *day* or *month*.
   */
  xTicks?: number | Interval | any[] | ParamRef;

  /**
   * The length of axis tick marks in pixels; negative values extend in the
   * opposite direction. Defaults to 6 for *x* and *y* axes and *color* and
   * *opacity* *ramp* legends, and 0 for *fx* and *fy* axes.
   */
  xTickSize?: number | ParamRef;

  /**
   * The desired approximate spacing between adjacent axis ticks, affecting the
   * default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels
   * for *y* and *fy*.
   */
  xTickSpacing?: number | ParamRef;

  /**
   * The distance between an axis tick mark and its associated text label (in
   * pixels); often defaults to 3, but may be affected by **xTickSize** and
   * **xTickRotate**.
   */
  xTickPadding?: number | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  xTickFormat?: string | null | ParamRef;

  /**
   * The rotation angle of axis tick labels in degrees clocksize; defaults to 0.
   */
  xTickRotate?: number | ParamRef;

  /**
   * Whether to show a grid aligned with the scale’s ticks. If true, show a grid
   * with the currentColor stroke; if a string, show a grid with the specified
   * stroke color; if an approximate number of ticks, an interval, or an array
   * of tick values, show corresponding grid lines. See also the grid mark.
   *
   * For axes only.
   */
  xGrid?: boolean | string | Interval | any[] | ParamRef;

  /**
   * If true, draw a line along the axis; if false (default), do not.
   */
  xLine?: boolean | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  xLabel?: string | null | ParamRef;

  /**
   * Where to place the axis **label** relative to the plot’s frame. For
   * vertical position scales (*y* and *fy*), may be *top*, *bottom*, or
   * *center*; for horizontal position scales (*x* and *fx*), may be *left*,
   * *right*, or *center*. Defaults to *center* for ordinal scales (including
   * *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*.
   */
  xLabelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center' | ParamRef;

  /**
   * Whether to apply a directional arrow such as → or ↑ to the x-axis scale
   * label. If *auto* (the default), the presence of the arrow depends on
   * whether the scale is ordinal.
   */
  xLabelArrow?: LabelArrow | ParamRef;

  /**
   * The axis **label** position offset (in pixels); default depends on margins
   * and orientation.
   */
  xLabelOffset?: number | ParamRef;

  /**
   * The font-variant attribute for axis ticks; defaults to *tabular-nums* for
   * quantitative axes.
   */
  xFontVariant?: string | ParamRef;

  /**
   * A short label representing the axis in the accessibility tree.
   */
  xAriaLabel?: string | ParamRef;

  /**
   * A textual description for the axis in the accessibility tree.
   */
  xAriaDescription?: string | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  xPercent?: boolean | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**.
   */
  xReverse?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  xZero?: boolean | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* scales only.
   */
  xExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* scales only.
   */
  xBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* scales only.
   */
  xConstant?: number | ParamRef;


  // y scale attributes

  /**
   * The *y* scale type, affecting how the scale encodes abstract data, say by
   * applying a mathematical transformation. If null, the scale is disabled.
   *
   * For quantitative data (numbers), defaults to *linear*; for temporal data
   * (dates), defaults to *utc*; for ordinal data (strings or booleans),
   * defaults to *point* for position scales,  The plot’s marks may also impose
   * a scale type; for example, the barY mark requires that *x* is a *band*
   * scale.
   */
  yScale?: PositionScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   *
   * Linear scales have a default domain of [0, 1]. Log scales have a default
   * domain of [1, 10] and cannot include zero.
   */
  yDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred
   * from the scale’s **type** and **domain**, and for position scales, the
   * plot’s dimensions. For continuous data (numbers and dates), and for
   * ordinal position scales (*point* and *band*), it is typically [*min*,
   * *max*]; it can be [*max*, *min*] to reverse the scale.
   */
  yRange?: any[] | Fixed | ParamRef;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  yNice?: boolean | number | Interval | ParamRef;

  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  yInset?: number | ParamRef;

  /**
   * Insets the top edge by the specified number of pixels. A positive value
   * insets towards the bottom edge (reducing effective area), while a negative
   * value insets away from the bottom edge (increasing it).
   */
  yInsetTop?: number | ParamRef;

  /**
   * Insets the bottom edge by the specified number of pixels. A positive value
   * insets towards the top edge (reducing effective area), while a negative
   * value insets away from the top edge (increasing it).
   */
  yInsetBottom?: number | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  yClamp?: boolean | ParamRef;

  /**
   * If true, round the output value to the nearest integer (pixel); useful for
   * crisp edges when rendering.
   *
   * For position scales only.
   */
  yRound?: boolean | ParamRef;

  /**
   * How to distribute unused space in the **range** for *point* and *band*
   * scales. A number in [0, 1], such as:
   *
   * - 0 - use the start of the range, putting unused space at the end
   * - 0.5 (default) - use the middle, distributing unused space evenly
   * - 1 use the end, putting unused space at the start
   *
   * For ordinal position scales only.
   */
  yAlign?: number | ParamRef;

  /**
   * For *band* scales, how much of the **range** to reserve to separate
   * adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of
   * inset for the first and last value as a proportion of the bandwidth;
   * defaults to 0.5 (50%).
   *
   * For ordinal position scales only.
   */
  yPadding?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to separate
   * adjacent bands.
   */
  yPaddingInner?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to inset first and
   * last bands.
   */
  yPaddingOuter?: number | ParamRef;

  /**
   * The side of the frame on which to place the implicit axis: *left* or
   * *right* for *y*. Defaults to *left* for a *y* scale.
   *
   * If *both*, an implicit axis will be rendered on both sides of the plot
   * (*left* and *right* for *y*). If null, the implicit axis is suppressed.
   */
  yAxis?: 'left' | 'right' | 'both' | boolean | null | ParamRef;

  /**
   * The desired approximate number of axis ticks, or an explicit array of tick
   * values, or an interval such as *day* or *month*.
   */
  yTicks?: number | Interval | any[] | ParamRef;

  /**
   * The length of axis tick marks in pixels; negative values extend in the
   * opposite direction. Defaults to 6 for *x* and *y* axes and *color* and
   * *opacity* *ramp* legends, and 0 for *fx* and *fy* axes.
   */
  yTickSize?: number | ParamRef;

  /**
   * The desired approximate spacing between adjacent axis ticks, affecting the
   * default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels
   * for *y* and *fy*.
   */
  yTickSpacing?: number | ParamRef;

  /**
   * The distance between an axis tick mark and its associated text label (in
   * pixels); often defaults to 3, but may be affected by **yTickSize** and
   * **yTickRotate**.
   */
  yTickPadding?: number | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  yTickFormat?: string | null | ParamRef;

  /**
   * The rotation angle of axis tick labels in degrees clocksize; defaults to 0.
   */
  yTickRotate?: number | ParamRef;

  /**
   * Whether to show a grid aligned with the scale’s ticks. If true, show a grid
   * with the currentColor stroke; if a string, show a grid with the specified
   * stroke color; if an approximate number of ticks, an interval, or an array
   * of tick values, show corresponding grid lines. See also the grid mark.
   *
   * For axes only.
   */
  yGrid?: boolean | string | Interval | any[] | ParamRef;

  /**
   * If true, draw a line along the axis; if false (default), do not.
   */
  yLine?: boolean | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  yLabel?: string | null | ParamRef;

  /**
   * Where to place the axis **label** relative to the plot’s frame. For
   * vertical position scales (*y* and *fy*), may be *top*, *bottom*, or
   * *center*; for horizontal position scales (*x* and *fx*), may be *left*,
   * *right*, or *center*. Defaults to *center* for ordinal scales (including
   * *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*.
   */
  yLabelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center' | ParamRef;

  /**
   * Whether to apply a directional arrow such as → or ↑ to the x-axis scale
   * label. If *auto* (the default), the presence of the arrow depends on
   * whether the scale is ordinal.
   */
  yLabelArrow?: LabelArrow | ParamRef;

  /**
   * The axis **label** position offset (in pixels); default depends on margins
   * and orientation.
   */
  yLabelOffset?: number | ParamRef;

  /**
   * The font-variant attribute for axis ticks; defaults to *tabular-nums* for
   * quantitative axes.
   */
  yFontVariant?: string | ParamRef;

  /**
   * A short label representing the axis in the accessibility tree.
   */
  yAriaLabel?: string | ParamRef;

  /**
   * A textual description for the axis in the accessibility tree.
   */
  yAriaDescription?: string | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  yPercent?: boolean | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**. Note that by default, when the *y* scale is
   * continuous, the *max* value points to the top of the screen, whereas
   * ordinal values are ranked from top to bottom.
   */
  yReverse?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  yZero?: boolean | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* scales only.
   */
  yExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* scales only.
   */
  yBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* scales only.
   */
  yConstant?: number | ParamRef;


  /**
   * Set the *x* and *y* scale domains.
   */
  xyDomain?: any[] | Fixed | ParamRef;


  // facet attributes

  /**
   * Shorthand to set the same default for all four facet margins: marginTop,
   * marginRight, marginBottom, and marginLeft.
   */
  facetMargin?: number | ParamRef;

  /**
   * The top facet margin; the (minimum) distance in pixels between the top
   * edges of the inner and outer plot area.
   */
  facetMarginTop?: number | ParamRef;

  /**
   * The right facet margin; the (minimum) distance in pixels between the right
   * edges of the inner and outer plot area.
   */
  facetMarginBottom?: number | ParamRef;

  /**
   * The bottom facet margin; the (minimum) distance in pixels between the
   * bottom edges of the inner and outer plot area.
   */
  facetMarginLeft?: number | ParamRef;

  /**
   * The left facet margin; the (minimum) distance in pixels between the left
   * edges of the inner and outer plot area.
   */
  facetMarginRight?: number | ParamRef;

  /**
   * Default axis grid for fx and fy scales; typically set to true to enable.
   */
  facetGrid?: boolean | string | Interval | any[] | ParamRef;

  /**
   * Default axis label for fx and fy scales; typically set to null to disable.
   */
  facetLabel?: string | null | ParamRef;


  // fx scale attributes

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For ordinal data (strings or booleans), it is an
   * array (or iterable) of values is the desired order, defaulting to natural
   * ascending order.
   */
  fxDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale.
   */
  fxRange?: any[] | Fixed | ParamRef;

  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  fxInset?: number | ParamRef;

  /**
   * Insets the right edge by the specified number of pixels. A positive value
   * insets towards the left edge (reducing effective area), while a negative
   * value insets away from the left edge (increasing it).
   */
  fxInsetRight?: number | ParamRef;

  /**
   * Insets the left edge by the specified number of pixels. A positive value
   * insets towards the right edge (reducing effective area), while a negative
   * value insets away from the right edge (increasing it).
   */
  fxInsetLeft?: number | ParamRef;

  /**
   * If true, round the output value to the nearest integer (pixel); useful for
   * crisp edges when rendering.
   *
   * For position scales only.
   */
  fxRound?: boolean | ParamRef;

  /**
   * How to distribute unused space in the **range** for *point* and *band*
   * scales. A number in [0, 1], such as:
   *
   * - 0 - use the start of the range, putting unused space at the end
   * - 0.5 (default) - use the middle, distributing unused space evenly
   * - 1 use the end, putting unused space at the start
   *
   * For ordinal position scales only.
   */
  fxAlign?: number | ParamRef;

  /**
   * For *band* scales, how much of the **range** to reserve to separate
   * adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of
   * inset for the first and last value as a proportion of the bandwidth;
   * defaults to 0.5 (50%).
   *
   * For ordinal position scales only.
   */
  fxPadding?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to separate
   * adjacent bands.
   */
  fxPaddingInner?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to inset first and
   * last bands.
   */
  fxPaddingOuter?: number | ParamRef;

  /**
   * The side of the frame on which to place the implicit axis: *top* or
   * *bottom* for *fx*. Defaults to *top* if there is a *bottom* *x* axis,
   * and otherwise *bottom*.
   *
   * If *both*, an implicit axis will be rendered on both sides of the plot
   * (*top* and *bottom* for *fx*). If null, the implicit axis is suppressed.
   */
  fxAxis?: 'top' | 'bottom' | 'both' | boolean | null | ParamRef;

  /**
   * The desired approximate number of axis ticks, or an explicit array of tick
   * values, or an interval such as *day* or *month*.
   */
  fxTicks?: number | Interval | any[] | ParamRef;

  /**
   * The length of axis tick marks in pixels; negative values extend in the
   * opposite direction. Defaults to 6 for *x* and *y* axes and *color* and
   * *opacity* *ramp* legends, and 0 for *fx* and *fy* axes.
   */
  fxTickSize?: number | ParamRef;

  /**
   * The desired approximate spacing between adjacent axis ticks, affecting the
   * default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels
   * for *y* and *fy*.
   */
  fxTickSpacing?: number | ParamRef;

  /**
   * The distance between an axis tick mark and its associated text label (in
   * pixels); often defaults to 3, but may be affected by **fxTickSize** and
   * **fxTickRotate**.
   */
  fxTickPadding?: number | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  fxTickFormat?: string | null | ParamRef;

  /**
   * The rotation angle of axis tick labels in degrees clocksize; defaults to 0.
   */
  fxTickRotate?: number | ParamRef;

  /**
   * Whether to show a grid aligned with the scale’s ticks. If true, show a grid
   * with the currentColor stroke; if a string, show a grid with the specified
   * stroke color; if an approximate number of ticks, an interval, or an array
   * of tick values, show corresponding grid lines. See also the grid mark.
   *
   * For axes only.
   */
  fxGrid?: boolean | string | Interval | any[] | ParamRef;

  /**
   * If true, draw a line along the axis; if false (default), do not.
   */
  fxLine?: boolean | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  fxLabel?: string | null | ParamRef;

  /**
   * Where to place the axis **label** relative to the plot’s frame. For
   * vertical position scales (*y* and *fy*), may be *top*, *bottom*, or
   * *center*; for horizontal position scales (*x* and *fx*), may be *left*,
   * *right*, or *center*. Defaults to *center* for ordinal scales (including
   * *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*.
   */
  fxLabelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center' | ParamRef;

  /**
   * The axis **label** position offset (in pixels); default depends on margins
   * and orientation.
   */
  fxLabelOffset?: number | ParamRef;

  /**
   * The font-variant attribute for axis ticks; defaults to *tabular-nums* for
   * quantitative axes.
   */
  fxFontVariant?: string | ParamRef;

  /**
   * A short label representing the axis in the accessibility tree.
   */
  fxAriaLabel?: string | ParamRef;

  /**
   * A textual description for the axis in the accessibility tree.
   */
  fxAriaDescription?: string | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**.
   */
  fxReverse?: boolean | ParamRef;


  // fy scale attributes

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For ordinal data (strings or booleans), it is an
   * array (or iterable) of values is the desired order, defaulting to natural
   * ascending order.
   */
  fyDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale.
   */
  fyRange?: any[] | Fixed | ParamRef;

  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  fyInset?: number | ParamRef;

  /**
   * Insets the top edge by the specified number of pixels. A positive value
   * insets towards the bottom edge (reducing effective area), while a negative
   * value insets away from the bottom edge (increasing it).
   */
  fyInsetTop?: number | ParamRef;

  /**
   * Insets the bottom edge by the specified number of pixels. A positive value
   * insets towards the top edge (reducing effective area), while a negative
   * value insets away from the top edge (increasing it).
   */
  fyInsetBottom?: number | ParamRef;

  /**
   * If true, round the output value to the nearest integer (pixel); useful for
   * crisp edges when rendering.
   *
   * For position scales only.
   */
  fyRound?: boolean | ParamRef;

  /**
   * How to distribute unused space in the **range** for *point* and *band*
   * scales. A number in [0, 1], such as:
   *
   * - 0 - use the start of the range, putting unused space at the end
   * - 0.5 (default) - use the middle, distributing unused space evenly
   * - 1 use the end, putting unused space at the start
   *
   * For ordinal position scales only.
   */
  fyAlign?: number | ParamRef;

  /**
   * For *band* scales, how much of the **range** to reserve to separate
   * adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of
   * inset for the first and last value as a proportion of the bandwidth;
   * defaults to 0.5 (50%).
   *
   * For ordinal position scales only.
   */
  fyPadding?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to separate
   * adjacent bands.
   */
  fyPaddingInner?: number | ParamRef;

  /**
   * For a *band* scale, how much of the range to reserve to inset first and
   * last bands.
   */
  fyPaddingOuter?: number | ParamRef;

  /**
   * The side of the frame on which to place the implicit axis: *left* or
   * *right* for *fy*. Defaults to *left* for an *fy* scale.
   *
   * If *both*, an implicit axis will be rendered on both sides of the plot
   * (*left* and *right* for *fy*). If null, the implicit axis is suppressed.
   */
  fyAxis?: 'left' | 'right' | 'both' | boolean | null | ParamRef;

  /**
   * The desired approximate number of axis ticks, or an explicit array of tick
   * values, or an interval such as *day* or *month*.
   */
  fyTicks?: number | Interval | any[] | ParamRef;

  /**
   * The length of axis tick marks in pixels; negative values extend in the
   * opposite direction. Defaults to 6 for *x* and *y* axes and *color* and
   * *opacity* *ramp* legends, and 0 for *fx* and *fy* axes.
   */
  fyTickSize?: number | ParamRef;

  /**
   * The desired approximate spacing between adjacent axis ticks, affecting the
   * default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels
   * for *y* and *fy*.
   */
  fyTickSpacing?: number | ParamRef;

  /**
   * The distance between an axis tick mark and its associated text label (in
   * pixels); often defaults to 3, but may be affected by **fyTickSize** and
   * **fyTickRotate**.
   */
  fyTickPadding?: number | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  fyTickFormat?: string | null | ParamRef;

  /**
   * The rotation angle of axis tick labels in degrees clocksize; defaults to 0.
   */
  fyTickRotate?: number | ParamRef;

  /**
   * Whether to show a grid aligned with the scale’s ticks. If true, show a grid
   * with the currentColor stroke; if a string, show a grid with the specified
   * stroke color; if an approximate number of ticks, an interval, or an array
   * of tick values, show corresponding grid lines. See also the grid mark.
   *
   * For axes only.
   */
  fyGrid?: boolean | string | Interval | any[] | ParamRef;

  /**
   * If true, draw a line along the axis; if false (default), do not.
   */
  fyLine?: boolean | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  fyLabel?: string | null | ParamRef;

  /**
   * Where to place the axis **label** relative to the plot’s frame. For
   * vertical position scales (*y* and *fy*), may be *top*, *bottom*, or
   * *center*; for horizontal position scales (*x* and *fx*), may be *left*,
   * *right*, or *center*. Defaults to *center* for ordinal scales (including
   * *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*.
   */
  fyLabelAnchor?: 'top' | 'right' | 'bottom' | 'left' | 'center' | ParamRef;

  /**
   * The axis **label** position offset (in pixels); default depends on margins
   * and orientation.
   */
  fyLabelOffset?: number | ParamRef;

  /**
   * The font-variant attribute for axis ticks; defaults to *tabular-nums* for
   * quantitative axes.
   */
  fyFontVariant?: string | ParamRef;

  /**
   * A short label representing the axis in the accessibility tree.
   */
  fyAriaLabel?: string | ParamRef;

  /**
   * A textual description for the axis in the accessibility tree.
   */
  fyAriaDescription?: string | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**.
   */
  fyReverse?: boolean | ParamRef;


  // color scale attributes

  /**
   * The *color* scale type, affecting how the scale encodes abstract data, say
   * by applying a mathematical transformation. If null, the scale is disabled.
   *
   * For quantitative data (numbers), defaults to *linear*; for temporal data
   * (dates), defaults to *utc*; for ordinal data (strings or booleans),
   * defaults to *point* for position scales, *categorical* for color scales,
   * and otherwise *ordinal*.
   */
  colorScale?: ColorScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   */
  colorDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**. For other ordinal data, it is an array
   * (or iterable) of output values in the same order as the **domain**.
   */
  colorRange?: any[] | Fixed | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  colorClamp?: boolean | ParamRef;

  /**
   * For a *quantile* scale, the number of quantiles (creates *n* - 1
   * thresholds); for a *quantize* scale, the approximate number of thresholds;
   * defaults to 5.
   */
  colorN?: number | ParamRef;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  colorNice?: boolean | number | Interval | ParamRef;

  /**
   * If specified, shorthand for setting the **colorRange**
   * or **colorInterpolate** option of a *color* scale.
   */
  colorScheme?: ColorScheme | ParamRef;

  /**
   * How to interpolate color range values. For quantitative scales only.
   * This attribute can be used to specify a color space for interpolating
   * colors specified in the **colorRange**.
   */
  colorInterpolate?: Interpolate | ParamRef;

  /**
   * For a diverging color scale, the input value (abstract value) that divides
   * the domain into two parts; defaults to 0 for *diverging* scales, dividing
   * the domain into negative and positive parts; defaults to 1 for
   * *diverging-log* scales. By default, diverging scales are symmetric around
   * the pivot; see the **symmetric** option.
   */
  colorPivot?: any | ParamRef;

  /**
   * For a diverging color scale, if true (the default), extend the domain to
   * ensure that the lower part of the domain (below the **pivot**) is
   * commensurate with the upper part of the domain (above the **pivot**).
   *
   * A symmetric diverging color scale may not use all of its output **range**;
   * this reduces contrast but ensures that deviations both below and above the
   * **pivot** are represented proportionally. Otherwise if false, the full
   * output **range** will be used; this increases contrast but values on
   * opposite sides of the **pivot** may not be meaningfully compared.
   */
  colorSymmetric?: boolean | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  colorLabel?: string | null | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  colorPercent?: boolean | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**.
   */
  colorReverse?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  colorZero?: boolean | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  colorTickFormat?: string | null | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* and *diverging-pow* scales only.
   */
  colorExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* and *diverging-log* scales only.
   */
  colorBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* and *diverging-symlog*
   * scales only.
   */
  colorConstant?: number | ParamRef;


  // opacity scale attributes

  /**
   * The *opacity* scale type, affecting how the scale encodes abstract data,
   * say by applying a mathematical transformation. If null, the scale is
   * disabled. The opacity scale defaults to *linear*; this scales is intended
   * for quantitative data.
   */
  opacityScale?: ContinuousScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   *
   * Opacity scales have a default domain from 0 to the maximum value of
   * associated channels.
   */
  opacityDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values).
   *
   * Opacity scales have a default range of [0, 1].
   */
  opacityRange?: any[] | Fixed | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  opacityClamp?: boolean | ParamRef;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  opacityNice?: boolean | number| Interval | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  opacityLabel?: string | null | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  opacityPercent?: boolean | ParamRef;

  /**
   * Whether to reverse the scale’s encoding; equivalent to reversing either the
   * **domain** or **range**.
   */
  opacityReverse?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  opacityZero?: boolean | ParamRef;

  /**
   * How to format inputs (abstract values) for axis tick labels; one of:
   *
   * - a [d3-format][1] string for numeric scales
   * - a [d3-time-format][2] string for temporal scales
   *
   * [1]: https://d3js.org/d3-time
   * [2]: https://d3js.org/d3-time-format
   */
  opacityTickFormat?: string | null | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* scales only.
   */
  opacityExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* scales only.
   */
  opacityBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* scales only.
   */
  opacityConstant?: number | ParamRef;


  // symbol scale attributes

  /**
   * The *symbol* scale type, affecting how the scale encodes abstract data,
   * say by applying a mathematical transformation. If null, the scale is
   * disabled. Defaults to an *ordinal* scale type.
   */
  symbolScale?: DiscreteScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. As symbol scales are discrete, the domain is an array
   * (or iterable) of values is the desired order, defaulting to natural
   * ascending order.
   */
  symbolDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and for position scales, the plot’s
   * dimensions. For continuous data (numbers and dates), and for ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale. For other ordinal data, such as
   * for a *color* scale, it is an array (or iterable) of output values in the
   * same order as the **domain**.
   *
   * Symbol scales have a default range of categorical symbols; the choice of
   * symbols depends on whether the associated dot mark is filled or stroked.
   */
  symbolRange?: any[] | Fixed | ParamRef;


  // r scale attributes

  /**
   * The *r* (radius) scale type, affecting how the scale encodes abstract
   * data, say by applying a mathematical transformation. If null, the scale
   * is disabled. The radius scale defaults to *sqrt*; this scale is intended
   * for quantitative data.
   */
  rScale?: ContinuousScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   *
   * Radius scales have a default domain from 0 to the median first quartile
   * of associated channels.
   */
  rDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and for position scales, the plot’s
   * dimensions. For continuous data (numbers and dates), and for ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale. For other ordinal data, such as
   * for a *color* scale, it is an array (or iterable) of output values in the
   * same order as the **domain**.
   *
   * Radius scales have a default range of [0, 3].
   */
  rRange?: any[] | Fixed | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  rClamp?: any;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  rNice?: boolean | number| Interval | ParamRef;

  /**
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   */
  rLabel?: string | null | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  rPercent?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  rZero?: boolean | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* scales only.
   */
  rExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* scales only.
   */
  rBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* scales only.
   */
  rConstant?: number | ParamRef;


  // length scale attributes

  /**
   * The *length* scale type, affecting how the scale encodes abstract data,
   * say by applying a mathematical transformation. If null, the scale is
   * disabled. The length scale defaults to *linear*, as this scale is intended
   * for quantitative data.
   */
  lengthScale?: ContinuousScaleType | null | ParamRef;

  /**
   * The extent of the scale’s inputs (abstract values). By default inferred
   * from channel values. For continuous data (numbers and dates), it is
   * typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale.
   * For ordinal data (strings or booleans), it is an array (or iterable) of
   * values is the desired order, defaulting to natural ascending order.
   *
   * Linear scales have a default domain of [0, 1]. Log scales have a default
   * domain of [1, 10] and cannot include zero. Radius scales have a default
   * domain from 0 to the median first quartile of associated channels. Length
   * have a default domain from 0 to the median median of associated channels.
   * Opacity scales have a default domain from 0 to the maximum value of
   * associated channels.
   */
  lengthDomain?: any[] | Fixed | ParamRef;

  /**
   * The extent of the scale’s outputs (visual values). By default inferred from
   * the scale’s **type** and **domain**, and for position scales, the plot’s
   * dimensions. For continuous data (numbers and dates), and for ordinal
   * position scales (*point* and *band*), it is typically [*min*, *max*]; it
   * can be [*max*, *min*] to reverse the scale. For other ordinal data, such as
   * for a *color* scale, it is an array (or iterable) of output values in the
   * same order as the **domain**.
   *
   * Length scales have a default range of [0, 12].
   */
  lengthRange?: any[] | Fixed | ParamRef;

  /**
   * If true, values below the domain minimum are treated as the domain minimum,
   * and values above the domain maximum are treated as the domain maximum.
   *
   * Clamping is useful for focusing on a subset of the data while ensuring that
   * extreme values remain visible, but use caution: clamped values may need an
   * annotation to avoid misinterpretation. Clamping typically requires setting
   * an explicit **domain** since if the domain is inferred, no values will be
   * outside the domain.
   *
   * For continuous scales only.
   */
  lengthClamp?: any;

  /**
   * If true, or a tick count or interval, extend the domain to nice round
   * values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and
   * nice time intervals for *utc* and *time* scales. Pass an interval such as
   * *minute*, *wednesday* or *month* to specify what constitutes a nice
   * interval.
   *
   * For continuous scales only.
   */
  lengthNice?: boolean | number| Interval | ParamRef;

  /**
   * If true, shorthand for a transform suitable for percentages, mapping
   * proportions in [0, 1] to [0, 100].
   */
  lengthPercent?: boolean | ParamRef;

  /**
   * Whether the **domain** must include zero. If the domain minimum is
   * positive, it will be set to zero; otherwise if the domain maximum is
   * negative, it will be set to zero.
   *
   * For quantitative scales only.
   */
  lengthZero?: boolean | ParamRef;

  /**
   * A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a
   * linear scale. For *pow* scales only.
   */
  lengthExponent?: number | ParamRef;

  /**
   * A log scale’s base; defaults to 10. Does not affect the scale’s encoding,
   * but rather the default ticks. For *log* scales only.
   */
  lengthBase?: number | ParamRef;

  /**
   * A symlog scale’s constant, expressing the magnitude of the linear region
   * around the origin; defaults to 1. For *symlog* scales only.
   */
  lengthConstant?: number | ParamRef;


  // projection attributes

  /**
   * The desired projection; one of:
   *
   * - a named built-in projection such as *albers-usa*
   * - null, for no projection
   *
   * Named projections are scaled and translated to fit
   * the **domain** to the plot’s frame (minus insets).
   */
  projectionType?: ProjectionName | null | ParamRef;

  /**
   * A GeoJSON object to fit to the plot’s frame (minus insets); defaults to a
   * Sphere for spherical projections (outline of the the whole globe).
   */
  projectionDomain?: object | ParamRef;

  /**
   * A rotation of the sphere before projection; defaults to [0, 0, 0].
   * Specified as Euler angles λ (yaw, or reference longitude), φ (pitch, or
   * reference latitude), and optionally γ (roll), in degrees.
   */
  projectionRotate?:
    | [x: number | ParamRef, y: number | ParamRef, z?: number | ParamRef]
    | ParamRef;

  /**
   * The [standard parallels][1]. For conic projections only.
   *
   * [1]: https://d3js.org/d3-geo/conic#conic_parallels
   */
  projectionParallels?: [y1: number | ParamRef, y2: number | ParamRef] | ParamRef;

  /**
   * The projection’s [sampling threshold][1].
   *
   * [1]: https://d3js.org/d3-geo/projection#projection_precision
   */
  projectionPrecision?: number | ParamRef;

  /**
   * The projection’s clipping method; one of:
   *
   * - *frame* or true (default) - clip to the plot’s frame (including margins but not insets)
   * - a number - clip to a circle of the given radius in degrees centered around the origin
   * - null or false - do not clip
   *
   * Some projections (such as [*armadillo*][1] and [*berghaus*][2]) require
   * spherical clipping: in that case set the marks’ **clip** option to
   * *sphere*.
   *
   * [1]: https://observablehq.com/@d3/armadillo
   * [2]: https://observablehq.com/@d3/berghaus-star
   */
  projectionClip?: boolean | number | 'frame' | null | ParamRef;

  /**
   * Shorthand to set the same default for all four projection insets.
   * All insets typically default to zero, though not always. A positive
   * inset reduces effective area, while a negative inset increases it.
   */
  projectionInset?: number | ParamRef;

  /**
   * Insets the top edge of the projection by the specified number of pixels.
   * A positive value insets towards the bottom edge (reducing effective area),
   * while a negative value insets away from the bottom edge (increasing it).
   */
  projectionInsetTop?: number | ParamRef;

  /**
   * Insets the right edge of the projection by the specified number of pixels.
   * A positive value insets towards the left edge (reducing effective area),
   * while a negative value insets away from the left edge (increasing it).
   */
  projectionInsetRight?: number | ParamRef;

  /**
   * Insets the bottom edge of the projection by the specified number of pixels.
   * A positive value insets towards the top edge (reducing effective area),
   * while a negative value insets away from the top edge (increasing it).
   */
  projectionInsetBottom?: number | ParamRef;

  /**
   * Insets the left edge of the projection by the specified number of pixels.
   * A positive value insets towards the right edge (reducing effective area),
   * while a negative value insets away from the right edge (increasing it).
   */
  projectionInsetLeft?: number | ParamRef;
}
