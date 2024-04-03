import { ParamRef } from './Param.js';

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
  style?: string | Partial<CSSStyleDeclaration> | null | ParamRef;

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
   * A textual label to show on the axis or legend; if null, show no label. By
   * default the scale label is inferred from channel definitions, possibly with
   * an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value.
   *
   * For axes and legends only.
   */
  label?: string | null | ParamRef;

  xyDomain?: any;

  // x scale attributes
  xScale?: any;
  xDomain?: any;
  xRange?: any;
  xNice?: any;
  xInset?: any;
  xInsetLeft?: any;
  xInsetRight?: any;
  xClamp?: any;
  xRound?: any;
  xAlign?: any;
  xPadding?: any;
  xPaddingInner?: any;
  xPaddingOuter?: any;
  xAxis?: any;
  xTicks?: any;
  xTickSize?: any;
  xTickSpacing?: any;
  xTickPadding?: any;
  xTickFormat?: any;
  xTickRotate?: any;
  xGrid?: any;
  xLine?: any;
  xLabel?: any;
  xLabelAnchor?: any;
  xLabelOffset?: any;
  xFontVariant?: any;
  xAriaLabel?: any;
  xAriaDescription?: any;
  xReverse?: any;
  xZero?: any;
  xBase?: any;
  xExponent?: any;
  xConstant?: any;

  // y scale attributes
  yScale?: any;
  yDomain?: any;
  yRange?: any;
  yNice?: any;
  yInset?: any;
  yInsetTop?: any;
  yInsetBottom?: any;
  yClamp?: any;
  yRound?: any;
  yAlign?: any;
  yPadding?: any;
  yPaddingInner?: any;
  yPaddingOuter?: any;
  yAxis?: any;
  yTicks?: any;
  yTickSize?: any;
  yTickSpacing?: any;
  yTickPadding?: any;
  yTickFormat?: any;
  yTickRotate?: any;
  yGrid?: any;
  yLine?: any;
  yLabel?: any;
  yLabelAnchor?: any;
  yLabelOffset?: any;
  yFontVariant?: any;
  yAriaLabel?: any;
  yAriaDescription?: any;
  yReverse?: any;
  yZero?: any;
  yBase?: any;
  yExponent?: any;
  yConstant?: any;

  // facet attributes
  facetMargin?: any;
  facetMarginTop?: any;
  facetMarginBottom?: any;
  facetMarginLeft?: any;
  facetMarginRight?: any;
  facetGrid?: any;
  facetLabel?: any;

  // fx scale attributes
  fxDomain?: any;
  fxRange?: any;
  fxNice?: any;
  fxInset?: any;
  fxInsetLeft?: any;
  fxInsetRight?: any;
  fxRound?: any;
  fxAlign?: any;
  fxPadding?: any;
  fxPaddingInner?: any;
  fxPaddingOuter?: any;
  fxAxis?: any;
  fxTicks?: any;
  fxTickSize?: any;
  fxTickSpacing?: any;
  fxTickPadding?: any;
  fxTickFormat?: any;
  fxTickRotate?: any;
  fxGrid?: any;
  fxLine?: any;
  fxLabel?: any;
  fxLabelAnchor?: any;
  fxLabelOffset?: any;
  fxFontVariant?: any;
  fxAriaLabel?: any;
  fxAriaDescription?: any;
  fxReverse?: any;

  // fy scale attributes
  fyDomain?: any;
  fyRange?: any;
  fyNice?: any;
  fyInset?: any;
  fyInsetTop?: any;
  fyInsetBottom?: any;
  fyRound?: any;
  fyAlign?: any;
  fyPadding?: any;
  fyPaddingInner?: any;
  fyPaddingOuter?: any;
  fyAxis?: any;
  fyTicks?: any;
  fyTickSize?: any;
  fyTickSpacing?: any;
  fyTickPadding?: any;
  fyTickFormat?: any;
  fyTickRotate?: any;
  fyGrid?: any;
  fyLine?: any;
  fyLabel?: any;
  fyLabelAnchor?: any;
  fyLabelOffset?: any;
  fyFontVariant?: any;
  fyAriaLabel?: any;
  fyAriaDescription?: any;
  fyReverse?: any;

  // color scale attributes
  colorScale?: any;
  colorDomain?: any;
  colorRange?: any;
  colorClamp?: any;
  colorN?: any;
  colorNice?: any;
  colorScheme?: any;
  colorInterpolate?: any;
  colorPivot?: any;
  colorSymmetric?: any;
  colorLabel?: any;
  colorReverse?: any;
  colorZero?: any;
  colorTickFormat?: any;
  colorBase?: any;
  colorExponent?: any;
  colorConstant?: any;

  // opacity scale attributes
  opacityScale?: any;
  opacityDomain?: any;
  opacityRange?: any;
  opacityClamp?: any;
  opacityNice?: any;
  opacityLabel?: any;
  opacityReverse?: any;
  opacityZero?: any;
  opacityTickFormat?: any;
  opacityBase?: any;
  opacityExponent?: any;
  opacityConstant?: any;

  // symbol scale attributes
  symbolScale?: any;
  symbolDomain?: any;
  symbolRange?: any;

  // r scale attributes
  rScale?: any;
  rDomain?: any;
  rRange?: any;
  rClamp?: any;
  rNice?: any;
  rZero?: any;
  rBase?: any;
  rExponent?: any;
  rConstant?: any;

  // length scale attributes
  lengthScale?: any;
  lengthDomain?: any;
  lengthRange?: any;
  lengthClamp?: any;
  lengthNice?: any;
  lengthZero?: any;
  lengthBase?: any;
  lengthExponent?: any;
  lengthConstant?: any;

  // projection attributes
  projectionType?: any;
  projectionParallels?: any;
  projectionPrecision?: any;
  projectionRotate?: any;
  projectionDomain?: any;
  projectionInset?: any;
  projectionInsetLeft?: any;
  projectionInsetRight?: any;
  projectionInsetTop?: any;
  projectionInsetBottom?: any;
  projectionClip?: any;
}
