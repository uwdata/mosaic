# Attributes

Plot attributes configure plot layout and scales, including resulting axes and legends.
Attributes are included as plot directives, in the form of functions that take either a literal attribute value or a [`Param`](../core/param) as input.

In addition to value arrays, scale domain attributes accept a `Fixed` symbol.
This setting indicates that the scale domain should first be determined by the data, but should then be held fixed across subsquent data updates.
A fixed domain will remain stable, preventing "jumps" in a display that might hamper interpretation of changes.

For additional documentation of scale attributes, see the corresponding [Observable Plot documentation](https://observablehq.com/plot/features/scales#scale-options).

## Plot Attributes

- `name(value)`: Set a globally unique name by which to refer to the plot.
- `style(value)`: Set CSS styles to apply to the plot output.
- `width(value)`: Set the plot width in pixels, including margins.
- `height(value)`: Set the plot height in pixels, including margins.
- `margin(value)`: Sets all margins to the same value in pixels.
- `marginLeft(value)`: Set the left plot margin in pixels.
- `marginRight(value)`: Set the right plot margin in pixels.
- `marginTop(value)`: Set the top plot margin in pixels.
- `marginBottom(value)`: Set the bottom plot margin in pixels.
- `margins(value)`: Set plot margins in pixels, using an object of the form `{left, right, top, bottom}`. Margins omitted from the object are not set.
- `align(value)`: Set the plot alignment.
- `aspectRatio(value)`: Set the plot aspect ratio.
- `inset(value)`: Set the plot insets in pixels.
- `axis(value)`: Set a global setting for including axes.
- `grid(value)`: Set a global setting for including grid lines.
- `label(value)`: Set a global setting for axis labels.
- `padding(value)`: Set the axis padding across all axes.
- `round(value)`: Set axis roundings across all axes.

## x Scale Attributes

- `xScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `xDomain(value)`: Set the scale domain.
- `xRange(value)`: Set the scale range.
- `xNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `xInset(value)`: Set the scale insets in pixels.
- `xInsetLeft(value)`: Set the left inset in pixels.
- `xInsetRight(value)`: Set the right inset in pixels.
- `xClamp(value)`: Set if the scale should clamp out-of-domain values.
- `xRound(value)`: Set if the scale should round output values to the nearest pixel.
- `xAlign(value)`: Set the axis alignment: where to distribute points or bands (0 = at start, 0.5 = at middle, 1 = at end).
- `xPadding(value)`: Set the axis padding (for `band` or `point` scales).
- `xPaddingInner(value)`: Set the axis inner padding (for `band` or `point` scales).
- `xPaddingOuter(value)`: Set the axis outer padding (for `band` or `point` scales).
- `xAxis(value)`: Set the axis position (`"top"` or `"bottom"`) or hide the axis (`null`).
- `xTicks(value)`: Set the approximate number of ticks to generate, or interval, or array of values.
- `xTickSize(value)`: Set the axis tick size.
- `xTickSpacing(value)`: Set the the approximate number of pixels between ticks (if xTicks is not specified).
- `xTickPadding(value)`: Set the axis tick padding.
- `xTickFormat(value)`: Set the axis tick format.
- `xTickRotate(value)`: Set the axis tick rotation.
- `xGrid(value)`: Set if the axis should include grid lines.
- `xLine(value)`: Set if the axis should includes a line on the plot edge.
- `xLabel(value)`: Set the axis label.
- `xLabelAnchor(value)`: Set the axis label anchor (`"left"`, `"center"`, `"right"`).
- `xLabelOffset(value)`: Set the axis label offset in pixels.
- `xFontVariant(value)`: Set the axis label font variant.
- `xAriaLabel(value)`: Set the axis ARIA label for accessibility.
- `xAriaDescription(value)`: Set the axis ARIA description for accessibility.
- `xReverse(value)`: Set if the range should be reversed.
- `xZero(value)`: Set the domain to always include zero.

## y Scale Attributes

- `yScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `yDomain(value)`: Set the scale domain.
- `yRange(value)`: Set the scale range.
- `yNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `yInset(value)`: Set the scale insets in pixels.
- `yInsetTop(value)`: Set the top inset in pixels.
- `yInsetBottom(value)`: Set the bottom inset in pixels.
- `yClamp(value)`: Set if the scale should clamp out-of-domain values.
- `yRound(value)`: Set if the scale should round output values to the nearest pixel.
- `yAlign(value)`: Set the axis alignment: where to distribute points or bands (0 = at start, 0.5 = at middle, 1 = at end).
- `yPadding(value)`: Set the axis padding (for `band` or `point` scales).
- `yPaddingInner(value)`: Set the axis inner padding (for `band` or `point` scales).
- `yPaddingOuter(value)`: Set the axis outer padding (for `band` or `point` scales).
- `yAxis(value)`: Set the axis position (`"left"` or `"right"`) or hide the axis (`null`).
- `yTicks(value)`: Set the approximate number of ticks to generate, or interval, or array of values.
- `yTickSize(value)`: Set the axis tick size.
- `yTickSpacing(value)`: Set the the approximate number of pixels between ticks (if yTicks is not specified).
- `yTickPadding(value)`: Set the axis tick padding.
- `yTickFormat(value)`: Set the axis tick format.
- `yTickRotate(value)`: Set the axis tick rotation.
- `yGrid(value)`: Set if the axis should include grid lines.
- `yLine(value)`: Set if the axis should includes a line on the plot edge.
- `yLabel(value)`: Set the axis label.
- `yLabelAnchor(value)`: Set the axis label anchor (`"top"`, `"middle"`, `"bottom"`).
- `yLabelOffset(value)`: Set the axis label offset in pixels.
- `yFontVariant(value)`: Set the axis label font variant.
- `yAriaLabel(value)`: Set the axis ARIA label for accessibility.
- `yAriaDescription(value)`: Set the axis ARIA description for accessibility.
- `yReverse(value)`: Set if the range should be reversed.
- `yZero(value)`: Set the domain to always include zero.

## color Scale Attributes

- `colorScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `colorDomain(value)`: Set the scale domain.
- `colorRange(value)`: Set the scale range.
- `colorClamp(value)`: Set if the scale should clamp out-of-domain values.
- `colorNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `colorScheme(value)`: Set the named color scheme to use.
- `colorInterpolate(value)`: Set a custom color interpolation function.
- `colorPivot(value)`: Set the pivot value for diverging `color` scales.
- `colorSymmetric(value)`: Set the domain to be symmetric around a pivot.
- `colorLabel(value)`: Set the scale label.
- `colorReverse(value)`: Set if the range should be reversed.
- `colorZero(value)`: Set the domain to always include zero.
- `colorTickFormat(value)`: Set the legend tick format.

## opacity Scale Attributes

- `opacityScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `opacityDomain(value)`: Set the scale domain.
- `opacityRange(value)`: Set the scale range.
- `opacityClamp(value)`: Set if the scale should clamp out-of-domain values.
- `opacityNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `opacityLabel(value)`: Set the scale label.
- `opacityReverse(value)`: Set if the range should be reversed.
- `opacityZero(value)`: Set the domain to always include zero.
- `opacityTickFormat(value)`: Set the legend tick format.

## r Scale Attributes

- `rScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `rDomain(value)`: Set the scale domain.
- `rRange(value)`: Set the scale range.
- `rClamp(value)`: Set if the scale should clamp out-of-domain values.
- `rNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `rLabel(value)`: Set the scale label.
- `rZero(value)`: Set the domain to always include zero.

## length Scale Attributes

- `lengthScale(value)`: Set the scale type, such as `"linear"`, `"log"`, etc.
- `lengthDomain(value)`: Set the scale domain.
- `lengthRange(value)`: Set the scale range.
- `lengthClamp(value)`: Set if the scale should clamp out-of-domain values.
- `lengthNice(value)`: Set if the scale domain should have "nice" (human-friendly) end points.
- `lengthZero(value)`: Set the domain to always include zero.

## fx Scale Attributes

- `fxDomain(value)`: Set the scale domain.
- `fxRange(value)`: Set the scale range.
- `fxInset(value)`: Set the scale insets in pixels.
- `fxInsetLeft(value)`: Set the left inset in pixels.
- `fxInsetRight(value)`: Set the right inset in pixels.
- `fxRound(value)`: Set if the scale should round output values to the nearest pixel.
- `fxAlign(value)`: Set the axis alignment: where to distribute points or bands (0 = at start, 0.5 = at middle, 1 = at end).
- `fxPadding(value)`: Set the axis padding (for `band` or `point` scales).
- `fxPaddingInner(value)`: Set the axis inner padding (for `band` or `point` scales).
- `fxPaddingOuter(value)`: Set the axis outer padding (for `band` or `point` scales).
- `fxAxis(value)`: Set the axis position (`"top"` or `"bottom"`) or hide the axis (`null`).
- `fxTickSize(value)`: Set the axis tick size.
- `fxTickPadding(value)`: Set the axis tick padding.
- `fxTickFormat(value)`: Set the axis tick format.
- `fxTickRotate(value)`: Set the axis tick rotation.
- `fxGrid(value)`: Set if the axis should include grid lines.
- `fxLabel(value)`: Set the axis label.
- `fxLabelAnchor(value)`: Set the axis label anchor (`"left"`, `"center"`, `"right"`).
- `fxLabelOffset(value)`: Set the axis label offset in pixels.
- `fxFontVariant(value)`: Set the axis label font variant.
- `fxAriaLabel(value)`: Set the axis ARIA label for accessibility.
- `fxAriaDescription(value)`: Set the axis ARIA description for accessibility.
- `fxReverse(value)`: Set if the range should be reversed.

## fy Scale Attributes

- `fyDomain(value)`: Set the scale domain.
- `fyRange(value)`: Set the  scale range.
- `fyInset(value)`: Set the scale insets in pixels.
- `fyInsetTop(value)`: Set the top inset in pixels.
- `fyInsetBottom(value)`: Set the bottom inset in pixels.
- `fyRound(value)`: Set if the scale should round output values to the nearest pixel.
- `fyAlign(value)`: Set the axis alignment: where to distribute points or bands (0 = at start, 0.5 = at middle, 1 = at end).
- `fyPadding(value)`: Set the axis padding (for `band` or `point` scales).
- `fyPaddingInner(value)`: Set the axis inner padding (for `band` or `point` scales).
- `fyPaddingOuter(value)`: Set the axis outer padding (for `band` or `point` scales).
- `fyAxis(value)`: Set the axis position (`"top"` or `"bottom"`) or hide the axis (`null`).
- `fyTickSize(value)`: Set the axis tick size.
- `fyTickPadding(value)`: Set the axis tick padding.
- `fyTickFormat(value)`: Set the axis tick format.
- `fyTickRotate(value)`: Set the axis tick rotation.
- `fyGrid(value)`: Set if the axis should include grid lines.
- `fyLabel(value)`: Set the axis label.
- `fyLabelAnchor(value)`: Set the axis label anchor (`"left"`, `"center"`, `"right"`).
- `fyLabelOffset(value)`: Set the axis label offset in pixels.
- `fyFontVariant(value)`: Set the axis label font variant.
- `fyAriaLabel(value)`: Set the axis ARIA label for accessibility.
- `fyAriaDescription(value)`: Set the axis ARIA description for accessibility.
- `fyReverse(value)`: Set if the range should be reversed.

## Facet Attributes

- `facetMargin(value)`: Set all four facet margins.
- `facetMarginTop(value)`: Set the facet top margin.
- `facetMarginBottom(value)`: Set the facet bottom margin.
- `facetMarginLeft(value)`: Set the facet left margin.
- `facetMarginRight(value)`: Set the facet right margin.
- `facetGrid(value)`: Set if grid lines should be drawn for each facet.
- `facetLabel(value)`: If null, disable default facet axis labels.

## Projection Attributes

For more on projections, see the [Observable Plot projection documentation](https://observablehq.com/plot/features/projections).

- `projectionType(value)`: Set the projection type, such as `"mercator"`, `"orthographic"`.
- `projectionParallels(value)`: Set the [standard parallels](https://github.com/d3/d3-geo/blob/main/README.md#conic_parallels) (for conic projections only).
- `projectionPrecision(value)`: Set the [sampling threshold](https://github.com/d3/d3-geo/blob/main/README.md#projection_precision).
- `projectionRotate(value)`: Set a two- or three- element array of Euler angles to rotate the sphere.
- `projectionDomain(value)`: Set a GeoJSON object to fit in the center of the (inset) frame.
- `projectionInset(value)`: Set the inset to the given amount in pixels when fitting to the frame (default zero).
- `projectionInsetLeft(value)`: Set the inset from the left edge of the frame (defaults to `projectionInset`).
- `projectionInsetRight(value)`: Set the inset from the right edge of the frame (defaults to `projectionInset`).
- `projectionInsetTop(value)`: Set the inset from the top edge of the frame (defaults to `projectionInset`).
- `projectionInsetBottom(value)`: Set the inset from the bottom edge of the frame (defaults to `projectionInset`).
- `projectionClip(value)`: Set the projection clipping method. One of: `"frame"` or `true` (default) to clip to the extent of the frame (including margins but not insets), a number to clip to a great circle of the given radius in degrees centered around the origin, or `null` or `false` to disable clipping.

::: warning
Interval interactors are not currently supported when cartographic projections are used.
:::
