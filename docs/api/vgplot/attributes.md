# Attributes

Plot attributes configure plot layout and scales, including resulting axes and legends.
Attributes are included as plot directives, in the form of functions that take either a literal attribute value or a [`Param`](../core/param) as input.

## Plot Attributes

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

- `xScale(value)`: Set the `x` scale type, such as `"linear"`, `"log"`, etc.
- `xDomain(value)`: Set the `x` scale domain.
- `xRange(value)`: Set the `x` scale range.
- `xNice(value)`: Set if the `x` scale domain should have "nice" (human-friendly) end points.
- `xInset(value)`: Set the `x` scale insets in pixels.
- `xInsetLeft(value)`: Set the `x` scale left inset in pixels.
- `xInsetRight(value)`: Set the `x` scale right inset in pixels.
- `xClamp(value)`: Set if the `x` scale should clamp out-of-domain values.
- `xRound(value)`: Set if the `x` scale should round output values to the nearest pixel.
- `xAlign(value)`: Set the `x` axis alignment.
- `xPadding(value)`: Set the `x` axis padding (for `band` or `point` scales).
- `xPaddingInner(value)`: Set the `x` axis inner padding (for `band` or `point` scales).
- `xPaddingOuter(value)`: Set the `x` axis outer padding (for `band` or `point` scales).
- `xAxis(value)`: Set the `x` axis position (`"top"` or `"bottom"`) or hide the axis (`null`).
- `xTicks(value)`: Set the approximate `x` axis tick count.
- `xTickSize(value)`: Set the `x` axis tick size.
- `xTickSpacing(value)`: Set the `x` axis tick spacing.
- `xTickPadding(value)`: Set the `x` axis tick padding.
- `xTickFormat(value)`: Set the `x` axis tick format.
- `xTickRotate(value)`: Set the `x` axis tick rotation.
- `xGrid(value)`: Set if the `x` axis should include grid lines.
- `xLine(value)`: Set if the `x` axis should includes a line on the plot edge.
- `xLabel(value)`: Set the `x` axis label.
- `xLabelAnchor(value)`: Set the `x` axis label anchor (`"left"`, `"center"`, `"right"`).
- `xLabelOffset(value)`: Set the `x` axis label offset in pixels.
- `xFontVariant(value)`: Set the `x` axis label font variant.
- `xAriaLabel(value)`: Set the `x` axis ARIA label for accessibility.
- `xAriaDescription(value)`: Set the `x` axis ARIA description for accessibility.
- `xReverse(value)`: Set if the `x` axis should be reversed.
- `xZero(value)`: Set the `x` axis domain should always include zero.

## y Scale Attributes

- `yScale(value)`: Set the `y` scale type, such as `"linear"`, `"log"`, etc.
- `yDomain(value)`: Set the `y` scale domain.
- `yRange(value)`: Set the `y` scale range.
- `yNice(value)`: Set if the `y` scale domain should have "nice" (human-friendly) end points.
- `yInset(value)`: Set the `y` scale insets in pixels.
- `yInsetTop(value)`: Set the `y` scale top inset in pixels.
- `yInsetBottom(value)`: Set the `y` scale bottom inset in pixels.
- `yClamp(value)`: Set if the `y` scale should clamp out-of-domain values.
- `yRound(value)`: Set if the `y` scale should round output values to the nearest pixel.
- `yAlign(value)`: Set the `y` axis alignment.
- `yPadding(value)`: Set the `y` axis padding (for `band` or `point` scales).
- `yPaddingInner(value)`: Set the `y` axis inner padding (for `band` or `point` scales).
- `yPaddingOuter(value)`: Set the `y` axis outer padding (for `band` or `point` scales).
- `yAxis(value)`: Set the `x` axis position (`"left"` or `"right"`) or hide the axis (`null`).
- `yTicks(value)`: Set the approximate `y` axis tick count.
- `yTickSize(value)`: Set the `y` axis tick size.
- `yTickSpacing(value)`: Set the `y` axis tick spacing.
- `yTickPadding(value)`: Set the `y` axis tick padding.
- `yTickFormat(value)`: Set the `y` axis tick format.
- `yTickRotate(value)`: Set the `y` axis tick rotation.
- `yGrid(value)`: Set if the `y` axis should include grid lines.
- `yLine(value)`: Set if the `y` axis should includes a line on the plot edge.
- `yLabel(value)`: Set the `y` axis label.
- `yLabelAnchor(value)`: Set the `y` axis label anchor (`"top"`, `"middle"`, `"bottom"`).
- `yLabelOffset(value)`: Set the `y` axis label offset in pixels.
- `yFontVariant(value)`: Set the `y` axis label font variant.
- `yAriaLabel(value)`: Set the `y` axis ARIA label for accessibility.
- `yAriaDescription(value)`: Set the `y` axis ARIA description for accessibility.
- `yReverse(value)`: Set if the `y` axis should be reversed.
- `yZero(value)`: Set the `y` axis domain should always include zero.

## color Scale Attributes

- `colorScale(value)`:
- `colorDomain(value)`:
- `colorRange(value)`:
- `colorClamp(value)`:
- `colorNice(value)`:
- `colorScheme(value)`:
- `colorInterpolate(value)`:
- `colorPivot(value)`:
- `colorSymmetric(value)`:
- `colorLabel(value)`:
- `colorReverse(value)`:
- `colorZero(value)`:
- `colorTickFormat(value)`:

## opacity Scale Attributes

- `opacityScale(value)`:
- `opacityDomain(value)`:
- `opacityRange(value)`:
- `opacityClamp(value)`:
- `opacityNice(value)`:
- `opacityLabel(value)`:
- `opacityReverse(value)`:
- `opacityZero(value)`:
- `opacityTickFormat(value)`:

## r Scale Attributes
- `rScale(value)`:
- `rDomain(value)`:
- `rRange(value)`:
- `rClamp(value)`:
- `rNice(value)`:
- `rZero(value)`:

## length Scale Attributes

- `lengthScale(value)`:
- `lengthDomain(value)`:
- `lengthRange(value)`:
- `lengthClamp(value)`:
- `lengthNice(value)`:
- `lengthZero(value)`:

## fx Scale Attributes

- `fxDomain(value)`:
- `fxRange(value)`:
- `fxNice(value)`:
- `fxInset(value)`:
- `fxInsetLeft(value)`:
- `fxInsetRight(value)`:
- `fxRound(value)`:
- `fxAlign(value)`:
- `fxPadding(value)`:
- `fxPaddingInner(value)`:
- `fxPaddingOuter(value)`:
- `fxAxis(value)`:
- `fxTicks(value)`:
- `fxTickSize(value)`:
- `fxTickSpacing(value)`:
- `fxTickPadding(value)`:
- `fxTickFormat(value)`:
- `fxTickRotate(value)`:
- `fxGrid(value)`:
- `fxLine(value)`:
- `fxLabel(value)`:
- `fxLabelAnchor(value)`:
- `fxLabelOffset(value)`:
- `fxFontVariant(value)`:
- `fxAriaLabel(value)`:
- `fxAriaDescription(value)`:
- `fxReverse(value)`:

## fy Scale Attributes

- `fyDomain(value)`:
- `fyRange(value)`:
- `fyNice(value)`:
- `fyInset(value)`:
- `fyInsetTop(value)`:
- `fyInsetBottom(value)`:
- `fyRound(value)`:
- `fyAlign(value)`:
- `fyPadding(value)`:
- `fyPaddingInner(value)`:
- `fyPaddingOuter(value)`:
- `fyAxis(value)`:
- `fyTicks(value)`:
- `fyTickSize(value)`:
- `fyTickSpacing(value)`:
- `fyTickPadding(value)`:
- `fyTickFormat(value)`:
- `fyTickRotate(value)`:
- `fyGrid(value)`:
- `fyLine(value)`:
- `fyLabel(value)`:
- `fyLabelAnchor(value)`:
- `fyLabelOffset(value)`:
- `fyFontVariant(value)`:
- `fyAriaLabel(value)`:
- `fyAriaDescription(value)`:
- `fyReverse(value)`:

## Facet Attributes

- `facetMargin(value)`:
- `facetMarginTop(value)`:
- `facetMarginBottom(value)`:
- `facetMarginLeft(value)`:
- `facetMarginRight(value)`:
- `facetGrid(value)`:
- `facetLabel(value)`:

## Projection Attributes

- `projectionType(value)`:
- `projectionParallels(value)`:
- `projectionPrecision(value)`:
- `projectionRotate(value)`:
- `projectionDomain(value)`:
- `projectionInset(value)`:
- `projectionInsetLeft(value)`:
- `projectionInsetRight(value)`:
- `projectionInsetTop(value)`:
- `projectionInsetBottom(value)`:
- `projectionClip(value)`:
