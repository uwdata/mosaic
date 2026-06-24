# Spec Schema Reference

This page is a complete, generated reference for the Mosaic declarative specification (JSON / YAML) format. Every component, mark, interactor, input, transform, and option below is derived directly from the [`@uwdata/mosaic-spec`](https://github.com/uwdata/mosaic/tree/main/packages/vgplot/spec/src/spec) TypeScript types via the published JSON schema. It is the authoritative list of valid names, types, and defaults.


> Notation: types use TypeScript-like unions (`a | b`). `ParamRef` means a `$`-prefixed reference to a param or selection. Names in `PascalCase` refer to other definitions in this page.

## Spec
A declarative Mosaic specification.

Type: `object`

## Meta
Specification metadata.


| Option | Type | Required | Description |
|---|---|---|---|
| `credit` | string |  | Credits or other acknowledgements. |
| `description` | string |  | A description of the specification content. |
| `title` | string |  | The specification title. |

## Config
Configuration options.


| Option | Type | Required | Description |
|---|---|---|---|
| `extensions` | string \| string[] |  |  |

## Common mark options
These options are accepted by (nearly) all marks. Individual mark sections below list only their mark-specific options and inherit these.

| Option | Type | Required | Description |
|---|---|---|---|
| `ariaDescription` | string \| ParamRef |  | The [aria-description][1]; a constant textual description. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description |
| `ariaHidden` | string \| ParamRef |  | The [aria-hidden][1] state; a constant indicating whether the element is exposed to an accessibility API. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden |
| `ariaLabel` | ChannelValue |  | The [aria-label][1]; a channel specifying short textual labels representing the value in the accessibility tree. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label |
| `channels` | object |  | Additional named channels, for example to include in a tooltip. Consists of (channel name, data field name) key-value pairs. |
| `clip` | "frame" \| "sphere" \| boolean \| null \| ParamRef |  | How to clip the mark; one of: - *frame* or true - clip to the plot’s frame (inner area) - *sphere* - clip to the projected sphere (*e.g.*, front hemisphere) - null or false - do not clip The *sphere* clip option requires a geographic projection. |
| `dx` | number \| ParamRef |  | The horizontal offset in pixels; a constant option. On low-density screens, an additional 0.5px offset may be applied for crisp edges. |
| `dy` | number \| ParamRef |  | The vertical offset in pixels; a constant option. On low-density screens, an additional 0.5px offset may be applied for crisp edges. |
| `facet` | "auto" \| "include" \| "exclude" \| "super" \| boolean \| null \| ParamRef |  | Whether to enable or disable faceting; one of: - *auto* (default) - automatically determine if this mark should be faceted - *include* (or true) - draw the subset of the mark’s data in the current facet - *exclude* - draw the subset of the mark’s data *not* in the current facet - *super* - draw this mark in a single frame that covers all facets - null (or false) - repeat this mark’s data across all facets (*i.e.*, no faceting) When a mark uses *super* faceting, it is not allowed to use position scales (*x*, *y*, *fx*, or *fy*); *super* faceting is intended for decorations, such as labels and legends. When top-level faceting is used, the default *auto* setting is equivalent to *include* when the mark data is strictly equal to the top-level facet data; otherwise it is equivalent to null. When the *include* or *exclude* facet mode is chosen, the mark data must be parallel to the top-level facet data: the data must have the same length and order. If the data are not parallel, then the wrong data may be shown in each facet. The default *auto* therefore requires strict equality (`===`) for safety, and using the facet data as mark data is recommended when using the *exclude* facet mode. (To construct parallel data safely, consider using [*array*.map][1] on the facet data.) When mark-level faceting is used, the default *auto* setting is equivalent to *include*: the mark will be faceted if either the **fx** or **fy** channel option (or both) is specified. The null or false option will disable faceting, while *exclude* draws the subset of the mark’s data *not* in the current facet. [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map |
| `facetAnchor` | "top" \| "right" \| "bottom" \| "left" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "top-empty" \| "right-empty" \| "bottom-empty" \| "left-empty" \| "empty" \| null \| ParamRef |  | How to place the mark with respect to facets; one of: - null (default for most marks) - display the mark in each non-empty facet - *top*, *right*, *bottom*, or *left* - display the mark only in facets on the given side - *top-empty*, *right-empty*, *bottom-empty*, or *left-empty* (default for axis marks) - display the mark only in facets that have empty space on the given side: either the margin, or an empty facet - *empty* - display the mark in empty facets only |
| `fill` | ChannelValueSpec \| ParamRef |  | The [fill][1]; a constant CSS color string, or a channel typically bound to the *color* scale. If all channel values are valid CSS colors, by default the channel will not be bound to the *color* scale, interpreting the colors literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill |
| `fillOpacity` | ChannelValueSpec \| ParamRef |  | The [fill-opacity][1]; a constant number between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity |
| `filter` | ChannelValue |  | Applies a transform to filter the mark’s index according to the given channel values; only truthy values are retained. Note that filtering only affects the rendered mark index, not the associated channel values, and has no effect on imputed scale domains. |
| `fx` | ChannelValue |  | The horizontal facet position channel, for mark-level faceting, bound to the *fx* scale. |
| `fy` | ChannelValue |  | The vertical facet position channel, for mark-level faceting, bound to the *fy* scale. |
| `href` | ChannelValue |  | The [href][1]; a channel specifying URLs for clickable links. May be used in conjunction with the **target** option to open links in another window. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/href |
| `imageFilter` | string \| ParamRef |  | A CSS [filter][1]; a constant string used to adjust the rendering of images, such as *blur(5px)*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/filter |
| `margin` | number \| ParamRef |  | Shorthand to set the same default for all four mark margins: **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**; typically defaults to 0, except for axis marks. |
| `marginBottom` | number \| ParamRef |  | The mark’s bottom margin; the minimum distance in pixels between the bottom edges of the inner and outer plot area. |
| `marginLeft` | number \| ParamRef |  | The mark’s left margin; the minimum distance in pixels between the left edges of the inner and outer plot area. |
| `marginRight` | number \| ParamRef |  | The mark’s right margin; the minimum distance in pixels between the right edges of the mark’s inner and outer plot area. |
| `marginTop` | number \| ParamRef |  | The mark’s top margin; the minimum distance in pixels between the top edges of the inner and outer plot area. |
| `mark` | "area" |  | An area mark. The area mark is rarely used directly; it is only needed when the baseline and topline have neither *x* nor *y* values in common. Use areaY for a horizontal orientation where the baseline and topline share *x* values, or areaX for a vertical orientation where the baseline and topline share *y* values. |
| `mixBlendMode` | string \| ParamRef |  | The [mix-blend-mode][1]; a constant string specifying how to blend content such as *multiply*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode |
| `opacity` | ChannelValueSpec |  | The [opacity][1]; a constant between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. For faster rendering, prefer the **strokeOpacity** or **fillOpacity** option. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/opacity |
| `paintOrder` | string \| ParamRef |  | The [paint-order][1]; a constant string specifying the order in which the **fill**, **stroke**, and any markers are drawn; defaults to *normal*, which draws the fill, then stroke, then markers; defaults to *stroke* for the text mark to create a “halo” around text to improve legibility. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/paint-order |
| `pointerEvents` | string \| ParamRef |  | The [pointer-events][1] property; a constant string such as *none*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events |
| `reverse` | boolean \| ParamRef |  | Applies a transform to reverse the order of the mark’s index, say for reverse input order. |
| `select` | SelectFilter |  | Applies a filter transform after data is loaded to highlight selected values only. For example, `first` and `last` select the first or last values of series only (using the *z* channel to separate series). Meanwhile, `nearestX` and `nearestY` select the point nearest to the pointer along the *x* or *y* channel dimension. Unlike Mosaic selections, a mark level *select* is internal to the mark only, and does not populate a param or selection value to be shared across clients. Note that filtering only affects the rendered mark index, not the associated channel values, and has no effect on imputed scale domains. |
| `shapeRendering` | string \| ParamRef |  | The [shape-rendering][1]; a constant string such as *crispEdges*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering |
| `sort` | SortOrder \| ChannelDomainSort |  | Either applies a transform to sort the mark’s index by the specified channel values, or imputes ordinal scale domains from this mark’s channels. When imputing ordinal scale domains from channel values, the **sort** option is an object whose keys are ordinal scale names such as *x* or *fx*, and whose values are channel names such as *y*, *y1*, or *y2*. For example, to impute the *y* scale’s domain from the associated *x* channel values in ascending order: ```js sort: {y: "x"} ``` For different sort options for different scales, replace the channel name with a *value* object and per-scale options: ```js sort: {y: {value: "-x"}} ``` When sorting the mark’s index, the **sort** option is instead one of: - a channel value definition for sorting given values in ascending order - a {value, order} object for sorting given values - a {channel, order} object for sorting the named channel’s values |
| `stroke` | ChannelValueSpec \| ParamRef |  | The [stroke][1]; a constant CSS color string, or a channel typically bound to the *color* scale. If all channel values are valid CSS colors, by default the channel will not be bound to the *color* scale, interpreting the colors literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke |
| `strokeDasharray` | string \| number \| ParamRef |  | The [stroke-dasharray][1]; a constant number indicating the length in pixels of alternating dashes and gaps, or a constant string of numbers separated by spaces or commas (_e.g._, *10 2* for dashes of 10 pixels separated by gaps of 2 pixels), or *none* (the default) for no dashing [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray |
| `strokeDashoffset` | string \| number \| ParamRef |  | The [stroke-dashoffset][1]; a constant indicating the offset in pixels of the first dash along the stroke; defaults to zero. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset |
| `strokeLinecap` | string \| ParamRef |  | The [stroke-linecap][1]; a constant specifying how to cap stroked paths, such as *butt*, *round*, or *square*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap |
| `strokeLinejoin` | string \| ParamRef |  | The [stroke-linejoin][1]; a constant specifying how to join stroked paths, such as *bevel*, *miter*, *miter-clip*, or *round*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin |
| `strokeMiterlimit` | number \| ParamRef |  | The [stroke-miterlimit][1]; a constant number specifying how to limit the length of *miter* joins on stroked paths. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-miterlimit |
| `strokeOpacity` | ChannelValueSpec |  | The [stroke-opacity][1]; a constant between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-opacity |
| `strokeWidth` | ChannelValueSpec |  | The [stroke-width][1]; a constant number in pixels, or a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width |
| `target` | string \| ParamRef |  | The [target][1]; a constant string specifying the target window (_e.g._, *_blank*) for clickable links; used in conjunction with the **href** option. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/target |
| `tip` | boolean \| TipPointer \| object \| ParamRef |  | Whether to generate a tooltip for this mark, and any tip options. |
| `title` | ChannelValue |  | The title; a channel specifying accessible, short textual descriptions as strings (possibly with newlines). If the tip option is specified, the title will be displayed with an interactive tooltip instead of using the SVG [title element][1]. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title |

## Marks

## Area
The area mark.


| Option | Type | Required | Description |
|---|---|---|---|
| `ariaDescription` | string \| ParamRef |  | The [aria-description][1]; a constant textual description. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description |
| `ariaHidden` | string \| ParamRef |  | The [aria-hidden][1] state; a constant indicating whether the element is exposed to an accessibility API. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden |
| `ariaLabel` | ChannelValue |  | The [aria-label][1]; a channel specifying short textual labels representing the value in the accessibility tree. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label |
| `channels` | object |  | Additional named channels, for example to include in a tooltip. Consists of (channel name, data field name) key-value pairs. |
| `clip` | "frame" \| "sphere" \| boolean \| null \| ParamRef |  | How to clip the mark; one of: - *frame* or true - clip to the plot’s frame (inner area) - *sphere* - clip to the projected sphere (*e.g.*, front hemisphere) - null or false - do not clip The *sphere* clip option requires a geographic projection. |
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `dx` | number \| ParamRef |  | The horizontal offset in pixels; a constant option. On low-density screens, an additional 0.5px offset may be applied for crisp edges. |
| `dy` | number \| ParamRef |  | The vertical offset in pixels; a constant option. On low-density screens, an additional 0.5px offset may be applied for crisp edges. |
| `facet` | "auto" \| "include" \| "exclude" \| "super" \| boolean \| null \| ParamRef |  | Whether to enable or disable faceting; one of: - *auto* (default) - automatically determine if this mark should be faceted - *include* (or true) - draw the subset of the mark’s data in the current facet - *exclude* - draw the subset of the mark’s data *not* in the current facet - *super* - draw this mark in a single frame that covers all facets - null (or false) - repeat this mark’s data across all facets (*i.e.*, no faceting) When a mark uses *super* faceting, it is not allowed to use position scales (*x*, *y*, *fx*, or *fy*); *super* faceting is intended for decorations, such as labels and legends. When top-level faceting is used, the default *auto* setting is equivalent to *include* when the mark data is strictly equal to the top-level facet data; otherwise it is equivalent to null. When the *include* or *exclude* facet mode is chosen, the mark data must be parallel to the top-level facet data: the data must have the same length and order. If the data are not parallel, then the wrong data may be shown in each facet. The default *auto* therefore requires strict equality (`===`) for safety, and using the facet data as mark data is recommended when using the *exclude* facet mode. (To construct parallel data safely, consider using [*array*.map][1] on the facet data.) When mark-level faceting is used, the default *auto* setting is equivalent to *include*: the mark will be faceted if either the **fx** or **fy** channel option (or both) is specified. The null or false option will disable faceting, while *exclude* draws the subset of the mark’s data *not* in the current facet. [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map |
| `facetAnchor` | "top" \| "right" \| "bottom" \| "left" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right" \| "top-empty" \| "right-empty" \| "bottom-empty" \| "left-empty" \| "empty" \| null \| ParamRef |  | How to place the mark with respect to facets; one of: - null (default for most marks) - display the mark in each non-empty facet - *top*, *right*, *bottom*, or *left* - display the mark only in facets on the given side - *top-empty*, *right-empty*, *bottom-empty*, or *left-empty* (default for axis marks) - display the mark only in facets that have empty space on the given side: either the margin, or an empty facet - *empty* - display the mark in empty facets only |
| `fill` | ChannelValueSpec \| ParamRef |  | The [fill][1]; a constant CSS color string, or a channel typically bound to the *color* scale. If all channel values are valid CSS colors, by default the channel will not be bound to the *color* scale, interpreting the colors literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill |
| `fillOpacity` | ChannelValueSpec \| ParamRef |  | The [fill-opacity][1]; a constant number between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity |
| `filter` | ChannelValue |  | Applies a transform to filter the mark’s index according to the given channel values; only truthy values are retained. Note that filtering only affects the rendered mark index, not the associated channel values, and has no effect on imputed scale domains. |
| `fx` | ChannelValue |  | The horizontal facet position channel, for mark-level faceting, bound to the *fx* scale. |
| `fy` | ChannelValue |  | The vertical facet position channel, for mark-level faceting, bound to the *fy* scale. |
| `href` | ChannelValue |  | The [href][1]; a channel specifying URLs for clickable links. May be used in conjunction with the **target** option to open links in another window. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/href |
| `imageFilter` | string \| ParamRef |  | A CSS [filter][1]; a constant string used to adjust the rendering of images, such as *blur(5px)*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/filter |
| `margin` | number \| ParamRef |  | Shorthand to set the same default for all four mark margins: **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**; typically defaults to 0, except for axis marks. |
| `marginBottom` | number \| ParamRef |  | The mark’s bottom margin; the minimum distance in pixels between the bottom edges of the inner and outer plot area. |
| `marginLeft` | number \| ParamRef |  | The mark’s left margin; the minimum distance in pixels between the left edges of the inner and outer plot area. |
| `marginRight` | number \| ParamRef |  | The mark’s right margin; the minimum distance in pixels between the right edges of the mark’s inner and outer plot area. |
| `marginTop` | number \| ParamRef |  | The mark’s top margin; the minimum distance in pixels between the top edges of the inner and outer plot area. |
| `mark` | "area" | yes | An area mark. The area mark is rarely used directly; it is only needed when the baseline and topline have neither *x* nor *y* values in common. Use areaY for a horizontal orientation where the baseline and topline share *x* values, or areaX for a vertical orientation where the baseline and topline share *y* values. |
| `mixBlendMode` | string \| ParamRef |  | The [mix-blend-mode][1]; a constant string specifying how to blend content such as *multiply*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `opacity` | ChannelValueSpec |  | The [opacity][1]; a constant between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. For faster rendering, prefer the **strokeOpacity** or **fillOpacity** option. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/opacity |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `paintOrder` | string \| ParamRef |  | The [paint-order][1]; a constant string specifying the order in which the **fill**, **stroke**, and any markers are drawn; defaults to *normal*, which draws the fill, then stroke, then markers; defaults to *stroke* for the text mark to create a “halo” around text to improve legibility. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/paint-order |
| `pointerEvents` | string \| ParamRef |  | The [pointer-events][1] property; a constant string such as *none*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events |
| `reverse` | boolean \| ParamRef |  | Applies a transform to reverse the order of the mark’s index, say for reverse input order. |
| `select` | SelectFilter |  | Applies a filter transform after data is loaded to highlight selected values only. For example, `first` and `last` select the first or last values of series only (using the *z* channel to separate series). Meanwhile, `nearestX` and `nearestY` select the point nearest to the pointer along the *x* or *y* channel dimension. Unlike Mosaic selections, a mark level *select* is internal to the mark only, and does not populate a param or selection value to be shared across clients. Note that filtering only affects the rendered mark index, not the associated channel values, and has no effect on imputed scale domains. |
| `shapeRendering` | string \| ParamRef |  | The [shape-rendering][1]; a constant string such as *crispEdges*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering |
| `sort` | SortOrder \| ChannelDomainSort |  | Either applies a transform to sort the mark’s index by the specified channel values, or imputes ordinal scale domains from this mark’s channels. When imputing ordinal scale domains from channel values, the **sort** option is an object whose keys are ordinal scale names such as *x* or *fx*, and whose values are channel names such as *y*, *y1*, or *y2*. For example, to impute the *y* scale’s domain from the associated *x* channel values in ascending order: ```js sort: {y: "x"} ``` For different sort options for different scales, replace the channel name with a *value* object and per-scale options: ```js sort: {y: {value: "-x"}} ``` When sorting the mark’s index, the **sort** option is instead one of: - a channel value definition for sorting given values in ascending order - a {value, order} object for sorting given values - a {channel, order} object for sorting the named channel’s values |
| `stroke` | ChannelValueSpec \| ParamRef |  | The [stroke][1]; a constant CSS color string, or a channel typically bound to the *color* scale. If all channel values are valid CSS colors, by default the channel will not be bound to the *color* scale, interpreting the colors literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke |
| `strokeDasharray` | string \| number \| ParamRef |  | The [stroke-dasharray][1]; a constant number indicating the length in pixels of alternating dashes and gaps, or a constant string of numbers separated by spaces or commas (_e.g._, *10 2* for dashes of 10 pixels separated by gaps of 2 pixels), or *none* (the default) for no dashing [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray |
| `strokeDashoffset` | string \| number \| ParamRef |  | The [stroke-dashoffset][1]; a constant indicating the offset in pixels of the first dash along the stroke; defaults to zero. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset |
| `strokeLinecap` | string \| ParamRef |  | The [stroke-linecap][1]; a constant specifying how to cap stroked paths, such as *butt*, *round*, or *square*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap |
| `strokeLinejoin` | string \| ParamRef |  | The [stroke-linejoin][1]; a constant specifying how to join stroked paths, such as *bevel*, *miter*, *miter-clip*, or *round*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin |
| `strokeMiterlimit` | number \| ParamRef |  | The [stroke-miterlimit][1]; a constant number specifying how to limit the length of *miter* joins on stroked paths. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-miterlimit |
| `strokeOpacity` | ChannelValueSpec |  | The [stroke-opacity][1]; a constant between 0 and 1, or a channel typically bound to the *opacity* scale. If all channel values are numbers in [0, 1], by default the channel will not be bound to the *opacity* scale, interpreting the opacities literally. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-opacity |
| `strokeWidth` | ChannelValueSpec |  | The [stroke-width][1]; a constant number in pixels, or a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width |
| `target` | string \| ParamRef |  | The [target][1]; a constant string specifying the target window (_e.g._, *_blank*) for clickable links; used in conjunction with the **href** option. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/target |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `tip` | boolean \| TipPointer \| object \| ParamRef |  | Whether to generate a tooltip for this mark, and any tip options. |
| `title` | ChannelValue |  | The title; a channel specifying accessible, short textual descriptions as strings (possibly with newlines). If the tip option is specified, the title will be displayed with an interactive tooltip instead of using the SVG [title element][1]. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, representing the area’s baseline, typically bound to the *x* scale. For areaX, setting this option disables the implicit stackX transform. |
| `x2` | ChannelValueSpec |  | The optional secondary (ending, often right) horizontal position channel, representing the area’s topline, typically bound to the *x* scale; if not specified, **x1** is used. For areaX, setting this option disables the implicit stackX transform. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, representing the area’s baseline, typically bound to the *y* scale. For areaY, setting this option disables the implicit stackY transform. |
| `y2` | ChannelValueSpec |  | The optional secondary (ending, often top) vertical position channel, representing the area’s topline, typically bound to the *y* scale; if not specified, **y1** is used. For areaY, setting this option disables the implicit stackY transform. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate areas; defaults to **fill** if a channel, or **stroke** if a channel. |

## AreaX
The areaX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position (or length) channel, typically bound to the *x* scale. If neither **x1** nor **x2** is specified, an implicit stackX transform is applied and **x** defaults to the identity function, assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise, if only one of **x1** or **x2** is specified, the other defaults to **x**, which defaults to zero. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, representing the area’s baseline, typically bound to the *x* scale. For areaX, setting this option disables the implicit stackX transform. |
| `x2` | ChannelValueSpec |  | The optional secondary (ending, often right) horizontal position channel, representing the area’s topline, typically bound to the *x* scale; if not specified, **x1** is used. For areaX, setting this option disables the implicit stackX transform. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate areas; defaults to **fill** if a channel, or **stroke** if a channel. |

## AreaY
The areaY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `y` | ChannelValueSpec |  | The vertical position (or length) channel, typically bound to the *y* scale. If neither **y1** nor **y2** is specified, an implicit stackY transform is applied and **y** defaults to the identity function, assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise, if only one of **y1** or **y2** is specified, the other defaults to **y**, which defaults to zero. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, representing the area’s baseline, typically bound to the *y* scale. For areaY, setting this option disables the implicit stackY transform. |
| `y2` | ChannelValueSpec |  | The optional secondary (ending, often top) vertical position channel, representing the area’s topline, typically bound to the *y* scale; if not specified, **y1** is used. For areaY, setting this option disables the implicit stackY transform. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate areas; defaults to **fill** if a channel, or **stroke** if a channel. |

## Arrow
The arrow mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bend` | number \| boolean \| ParamRef |  | The angle, a constant in degrees, between the straight line intersecting the arrow’s two control points and the outgoing tangent direction of the arrow from the start point. The angle must be within ±90°; a positive angle will produce a clockwise curve, while a negative angle will produce a counterclockwise curve; zero (the default) will produce a straight line. Use true for 22.5°. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `headAngle` | number \| ParamRef |  | How pointy the arrowhead is, in degrees; a constant typically between 0° and 180°, and defaults to 60°. |
| `headLength` | number \| ParamRef |  | The size of the arrowhead relative to the **strokeWidth**; a constant. Assuming the default of stroke width 1.5px, this is the length of the arrowhead’s side in pixels. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for **insetStart** and **insetEnd**. |
| `insetEnd` | number \| ParamRef |  | The ending inset, a constant in pixels; defaults to 0. A positive inset shortens the arrow by moving the ending point towards the starting point, while a negative inset extends it by moving the ending point in the opposite direction. A positive ending inset may be useful if the arrow points to a dot. |
| `insetStart` | number \| ParamRef |  | The starting inset, a constant in pixels; defaults to 0. A positive inset shortens the arrow by moving the starting point towards the endpoint point, while a negative inset extends it by moving the starting point in the opposite direction. A positive starting inset may be useful if the arrow emerges from a dot. |
| `sweep` | number \| "+x" \| "-x" \| "+y" \| "-y" \| ParamRef |  | The sweep order; defaults to 1 indicating a positive (clockwise) bend angle; -1 indicates a negative (anticlockwise) bend angle; 0 effectively clears the bend angle. If set to *-x*, the bend angle is flipped when the ending point is to the left of the starting point — ensuring all arrows bulge up (down if bend is negative); if set to *-y*, the bend angle is flipped when the ending point is above the starting point — ensuring all arrows bulge right (left if bend is negative); the sign is negated for *+x* and *+y*. |
| `x` | ChannelValueSpec |  | The horizontal position, for vertical arrows; typically bound to the *x* scale; shorthand for setting defaults for both **x1** and **x2**. |
| `x1` | ChannelValueSpec |  | The starting horizontal position; typically bound to the *x* scale; also sets a default for **x2**. |
| `x2` | ChannelValueSpec |  | The ending horizontal position; typically bound to the *x* scale; also sets a default for **x1**. |
| `y` | ChannelValueSpec |  | The vertical position, for horizontal arrows; typically bound to the *y* scale; shorthand for setting defaults for both **y1** and **y2**. |
| `y1` | ChannelValueSpec |  | The starting vertical position; typically bound to the *y* scale; also sets a default for **y2**. |
| `y2` | ChannelValueSpec |  | The ending vertical position; typically bound to the *y* scale; also sets a default for **y1**. |

## AxisX
The axisX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `label` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `labelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `labelArrow` | "auto" \| "up" \| "right" \| "down" \| "left" \| "none" \| true \| false \| null \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `labelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `textStroke` | ChannelValueSpec \| ParamRef |  | The tick text **stroke**, say for a *white* outline to improve legibility; defaults to null. |
| `textStrokeOpacity` | ChannelValueSpec |  | The tick text **strokeOpacity**; defaults to 1; has no effect unless **textStroke** is set. |
| `textStrokeWidth` | ChannelValueSpec |  | The tick text **strokeWidth**; defaults to 4; has no effect unless **textStroke** is set. |
| `tickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `tickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `tickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `tickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## AxisY
The axisY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `label` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `labelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `labelArrow` | "auto" \| "up" \| "right" \| "down" \| "left" \| "none" \| true \| false \| null \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `labelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `textStroke` | ChannelValueSpec \| ParamRef |  | The tick text **stroke**, say for a *white* outline to improve legibility; defaults to null. |
| `textStrokeOpacity` | ChannelValueSpec |  | The tick text **strokeOpacity**; defaults to 1; has no effect unless **textStroke** is set. |
| `textStrokeWidth` | ChannelValueSpec |  | The tick text **strokeWidth**; defaults to 4; has no effect unless **textStroke** is set. |
| `tickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `tickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `tickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `tickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## AxisFx
The axisFx mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `label` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `labelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `labelArrow` | "auto" \| "up" \| "right" \| "down" \| "left" \| "none" \| true \| false \| null \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `labelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `textStroke` | ChannelValueSpec \| ParamRef |  | The tick text **stroke**, say for a *white* outline to improve legibility; defaults to null. |
| `textStrokeOpacity` | ChannelValueSpec |  | The tick text **strokeOpacity**; defaults to 1; has no effect unless **textStroke** is set. |
| `textStrokeWidth` | ChannelValueSpec |  | The tick text **strokeWidth**; defaults to 4; has no effect unless **textStroke** is set. |
| `tickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `tickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `tickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `tickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## AxisFy
The axisFy mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `label` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `labelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `labelArrow` | "auto" \| "up" \| "right" \| "down" \| "left" \| "none" \| true \| false \| null \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `labelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `textStroke` | ChannelValueSpec \| ParamRef |  | The tick text **stroke**, say for a *white* outline to improve legibility; defaults to null. |
| `textStrokeOpacity` | ChannelValueSpec |  | The tick text **strokeOpacity**; defaults to 1; has no effect unless **textStroke** is set. |
| `textStrokeWidth` | ChannelValueSpec |  | The tick text **strokeWidth**; defaults to 4; has no effect unless **textStroke** is set. |
| `tickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `tickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `tickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `tickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## GridX
The gridX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position of the tick; an optional channel bound to the *x* scale. If not specified, the rule will be horizontally centered in the plot’s frame. |
| `y` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary vertical position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `y1` | ChannelValueSpec |  | The primary (starting, often bottom) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |
| `y2` | ChannelValueSpec |  | The secondary (ending, often top) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |

## GridY
The gridY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary horizontal position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `x1` | ChannelValueSpec |  | The primary (starting, often left) horizontal position of the tick; a channel bound to the *x* scale. If *x* represents ordinal values, use a tickY mark instead. |
| `x2` | ChannelValueSpec |  | The secondary (ending, often right) horizontal position of the tick; a channel bound to the *x* scale. If *x* represents ordinal values, use a tickY mark instead. |
| `y` | ChannelValueSpec |  | The vertical position of the tick; an optional channel bound to the *y* scale. If not specified, the rule will be vertically centered in the plot’s frame. |

## GridFx
The gridFx mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueSpec |  | The horizontal position of the tick; an optional channel bound to the *x* scale. If not specified, the rule will be horizontally centered in the plot’s frame. |
| `y` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary vertical position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `y1` | ChannelValueSpec |  | The primary (starting, often bottom) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |
| `y2` | ChannelValueSpec |  | The secondary (ending, often top) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |

## GridFy
The gridFy mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| ParamRef |  | The side of the frame on which to place the axis: *top* or *bottom* for horizontal axes (axisX and axisFx) and their associated vertical grids (gridX and gridFx), or *left* or *right* for vertical axes (axisY and axisFY) and their associated horizontal grids (gridY and gridFy). The default **anchor** depends on the associated scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* For grids, the **anchor** also affects the extent of grid lines when the opposite dimension is specified (**x** for gridY and **y** for gridX). |
| `color` | ChannelValueSpec \| ParamRef |  | A shorthand for setting both **fill** and **stroke**; affects the stroke of tick vectors and grid rules, and the fill of tick texts and axis label texts; defaults to *currentColor*. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `interval` | Interval \| ParamRef |  | Enforces uniformity for data at regular intervals, such as integer values or daily samples. The interval may be one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* This option sets the internal transform to the given interval’s *interval*.floor function. In addition, the default **domain** will align with interval boundaries. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `ticks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `x` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary horizontal position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `x1` | ChannelValueSpec |  | The primary (starting, often left) horizontal position of the tick; a channel bound to the *x* scale. If *x* represents ordinal values, use a tickY mark instead. |
| `x2` | ChannelValueSpec |  | The secondary (ending, often right) horizontal position of the tick; a channel bound to the *x* scale. If *x* represents ordinal values, use a tickY mark instead. |
| `y` | ChannelValueSpec |  | The vertical position of the tick; an optional channel bound to the *y* scale. If not specified, the rule will be vertically centered in the plot’s frame. |

## BarX
The barX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for barX, or **y** for barY) into an interval (**x1** and **x2** for barX, or **y1** and **y2** for barY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for barX, or stackY for barY). |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueIntervalSpec |  | The horizontal position (or length/width) channel, typically bound to the *x* scale. If neither **x1** nor **x2** nor **interval** is specified, an implicit stackX transform is applied and **x** defaults to the identity function, assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise if an **interval** is specified, then **x1** and **x2** are derived from **x**, representing the lower and upper bound of the containing interval, respectively. Otherwise, if only one of **x1** or **x2** is specified, the other defaults to **x**, which defaults to zero. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, typically bound to the *x* scale. Setting this option disables the implicit stackX transform. If *x* represents ordinal values, use a cell mark instead. |
| `x2` | ChannelValueSpec |  | The required secondary (ending, often right) horizontal position channel, typically bound to the *x* scale. Setting this option disables the implicit stackX transform. If *x* represents ordinal values, use a cell mark instead. |
| `y` | ChannelValueSpec |  | The optional vertical position of the bar; a ordinal channel typically bound to the *y* scale. If not specified, the bar spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a rectX mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## BarY
The barY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for barX, or **y** for barY) into an interval (**x1** and **x2** for barX, or **y1** and **y2** for barY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for barX, or stackY for barY). |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueSpec |  | The optional horizontal position of the bar; a ordinal channel typically bound to the *x* scale. If not specified, the bar spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a rectY mark instead. |
| `y` | ChannelValueIntervalSpec |  | The vertical position (or length/height) channel, typically bound to the *y* scale. If neither **y1** nor **y2** nor **interval** is specified, an implicit stackY transform is applied and **y** defaults to the identity function, assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise if an **interval** is specified, then **y1** and **y2** are derived from **y**, representing the lower and upper bound of the containing interval, respectively. Otherwise, if only one of **y1** or **y2** is specified, the other defaults to **y**, which defaults to zero. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, typically bound to the *y* scale. Setting this option disables the implicit stackY transform. If *y* represents ordinal values, use a cell mark instead. |
| `y2` | ChannelValueSpec |  | The required secondary (ending, often top) horizontal position channel, typically bound to the *y* scale. Setting this option disables the implicit stackY transform. If *y* represents ordinal values, use a cell mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## Cell
The cell mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueSpec |  | The horizontal position of the cell; an optional ordinal channel typically bound to the *x* scale. If not specified, the cell spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a barX mark instead; if *y* is also quantitative or temporal, use a rect mark. |
| `y` | ChannelValueSpec |  | The vertical position of the cell; an optional ordinal channel typically bound to the *y* scale. If not specified, the cell spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a barY mark instead; if *x* is also quantitative or temporal, use a rect mark. |

## CellX
The cellX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueSpec |  | The horizontal position of the cell; an optional ordinal channel typically bound to the *x* scale. If not specified, the cell spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a barX mark instead; if *y* is also quantitative or temporal, use a rect mark. |
| `y` | ChannelValueSpec |  | The vertical position of the cell; an optional ordinal channel typically bound to the *y* scale. If not specified, the cell spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a barY mark instead; if *x* is also quantitative or temporal, use a rect mark. |

## CellY
The cellY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueSpec |  | The horizontal position of the cell; an optional ordinal channel typically bound to the *x* scale. If not specified, the cell spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a barX mark instead; if *y* is also quantitative or temporal, use a rect mark. |
| `y` | ChannelValueSpec |  | The vertical position of the cell; an optional ordinal channel typically bound to the *y* scale. If not specified, the cell spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a barY mark instead; if *x* is also quantitative or temporal, use a rect mark. |

## Contour
The contour mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `thresholds` | number \| number[] \| ParamRef |  | The number of contour thresholds to subdivide the domain into discrete level sets; defaults to 10. One of: - a count representing the desired number of bins - an array of *n* threshold values for *n* - 1 bins |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |

## DelaunayLink
The delaunayLink mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping to produce multiple (possibly overlapping) triangulations. |

## DelaunayMesh
The delaunayMesh mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping to produce multiple (possibly overlapping) triangulations. |

## Hull
The hull mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping to produce multiple (possibly overlapping) triangulations. |

## Voronoi
The voronoi mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping to produce multiple (possibly overlapping) triangulations. |

## VoronoiMesh
The voronoiMesh mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping to produce multiple (possibly overlapping) triangulations. |

## DenseLine
The denseLine mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `imageRendering` | string \| ParamRef |  | The [image-rendering attribute][1]; defaults to *auto* (bilinear). The option may be set to *pixelated* to disable bilinear interpolation for a sharper image; however, note that this is not supported in WebKit. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `normalize` | boolean \| ParamRef |  | Flag to perform approximate arc length normalization of line segments to prevent artifacts due to overcounting steep lines. Defaults to `true`. |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |
| `z` | ChannelValue |  | A ordinal channel for grouping data into series to be drawn as separate lines. |

## Density
The density mark for 2D densities.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `type` | "dot" \| "circle" \| "hexagon" \| "cell" \| "text" \| ParamRef |  | The basic mark type to use to render 2D density values. Defaults to a dot mark; cell and text marks are also supported. |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## DensityX
The densityX mark.

Type: `object`

## DensityY
The densityY mark.

Type: `object`

## Dot
The dot mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## DotX
The dotX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `interval` | Interval \| ParamRef |  | An interval (such as *day* or a number), to transform **y** values to the middle of the interval. |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueIntervalSpec |  | The vertical position of the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## DotY
The dotY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `interval` | Interval \| ParamRef |  | An interval (such as *day* or a number), to transform **x** values to the middle of the interval. |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `x` | ChannelValueIntervalSpec |  | The horizontal position of the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## Circle
The circle mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## Hexagon
The hexagon mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## ErrorBarX
The errorbarX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `ci` | number \| ParamRef |  | The confidence interval in (0, 1); defaults to 0.95. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec | yes | The dependent variable horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The independent variable vertical position channel, typically bound to the *y* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data, producing an independent error bar for each group. If not specified, it defaults to **stroke** if a channel. |

## ErrorBarY
The errorbarY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `ci` | number \| ParamRef |  | The confidence interval in (0, 1); defaults to 0.95. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec |  | The independent variable horizontal position channel, typically bound to the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `y` | ChannelValueSpec | yes | The dependent variable vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data, producing an independent error bar for each group. If not specified, it defaults to **stroke** if a channel. |

## Frame
The frame mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "top" \| "right" \| "bottom" \| "left" \| null \| ParamRef |  | If null (default), the rectangular outline of the frame is drawn; otherwise the frame is drawn as a line only on the given side, and the **rx**, **ry**, **fill**, and **fillOpacity** options are ignored. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |

## Geo
The geo mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `geometry` | ChannelValue |  | A required channel for the geometry to render; defaults to identity, assuming *data* is a GeoJSON object or an iterable of GeoJSON objects. |
| `r` | ChannelValueSpec \| ParamRef |  | The size of Point and MultiPoint geometries, defaulting to a constant 3 pixels. If **r** is a number, it is interpreted as a constant radius in pixels; otherwise it is interpreted as a channel and the effective radius is controlled by the *r* scale, which defaults to a *sqrt* scale such that the visual area of a point is proportional to its associated value. If **r** is a channel, geometries will be sorted by descending radius by default, to limit occlusion; use the **sort** transform to control render order. Geometries with a nonpositive radius are not drawn. |

## Graticule
The graticule mark.

Inherits all [common mark options](#common-mark-options).

_No mark-specific options beyond the common mark options._

## Sphere
The sphere mark.

Inherits all [common mark options](#common-mark-options).

_No mark-specific options beyond the common mark options._

## Hexbin
The hexbin mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `binWidth` | number \| ParamRef |  | The distance between centers of neighboring hexagons, in pixels; defaults to 20. If also using a hexgrid mark, use matching **binWidth** values. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. For example, for dots distributed horizontally at the top of the frame: ```js Plot.dot(data, {x: "date", frameAnchor: "top"}) ``` |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `r` | ChannelValueSpec \| number \| ParamRef |  | The radius of dots; either a channel or constant. When a number, it is interpreted as a constant radius in pixels. Otherwise it is interpreted as a channel, typically bound to the *r* channel, which defaults to the *sqrt* type for proportional symbols. The radius defaults to 4.5 pixels when using the **symbol** channel, and otherwise 3 pixels. Dots with a nonpositive radius are not drawn. |
| `rotate` | ChannelValue \| number \| ParamRef |  | The rotation angle of dots in degrees clockwise; either a channel or a constant. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. Defaults to 0°, pointing up. |
| `symbol` | ChannelValueSpec \| SymbolType \| ParamRef |  | The categorical symbol; either a channel or a constant. A constant symbol can be specified by a valid symbol name such as *star*, or a symbol object (implementing the draw method); otherwise it is interpreted as a channel. Defaults to *circle* for the **dot** mark, and *hexagon* for the **hexagon** mark. If the **symbol** channel’s values are all symbols, symbol names, or nullish, the channel is unscaled (values are interpreted literally); otherwise, the channel is bound to the *symbol* scale. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `type` | "dot" \| "circle" \| "hexagon" \| "text" \| ParamRef |  | The basic mark type to use for hex-binned values. Defaults to a hexagon mark; dot and text marks are also supported. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the dot’s center, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the dot’s center, typically bound to the *y* scale. |
| `z` | ChannelValue |  | How to subdivide bins. If not specified, defaults to the *fill* channel, if any, or the *stroke* channel, if any. If null, bins will not be subdivided. |

## Hexgrid
The hexgrid mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `binWidth` | number \| ParamRef |  | The distance between centers of neighboring hexagons, in pixels; defaults to 20. Should match the **binWidth** of the hexbin mark. |

## Image

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `crossOrigin` | string \| ParamRef |  | The [cross-origin][1] behavior. See the [Plot.image notebook][2] for details. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/crossorigin [2]: https://observablehq.com/@observablehq/plot-image |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y** based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `height` | ChannelValue \| ParamRef |  | The image height in pixels. When a number, it is interpreted as a constant radius in pixels; otherwise it is interpreted as a channel. Also sets the default **height**; if neither are set, defaults to 16. Images with a nonpositive height are not drawn. |
| `imageRendering` | string \| ParamRef |  | The [image-rendering attribute][1]; defaults to *auto* (bilinear). The option may be set to *pixelated* to disable bilinear interpolation for a sharper image; however, note that this is not supported in WebKit. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering |
| `preserveAspectRatio` | string \| ParamRef |  | The image [aspect ratio][1]; defaults to *xMidYMid meet*. To crop the image instead of scaling it to fit, use *xMidYMid slice*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/preserveAspectRatio |
| `r` | ChannelValue \| ParamRef |  | The image clip radius, for circular images. If null (default), images are not clipped; when a number, it is interpreted as a constant in pixels; otherwise it is interpreted as a channel, typically bound to the *r* scale. Also defaults **height** and **width** to twice its value. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle, in degrees clockwise. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `src` | ChannelValue \| ParamRef |  | The required image URL (or relative path). If a string that starts with a dot, slash, or URL protocol (*e.g.*, “https:”) it is assumed to be a constant; otherwise it is interpreted as a channel. |
| `width` | ChannelValue \| ParamRef |  | The image width in pixels. When a number, it is interpreted as a constant radius in pixels; otherwise it is interpreted as a channel. Also sets the default **height**; if neither are set, defaults to 16. Images with a nonpositive width are not drawn. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the image’s center; typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the image’s center; typically bound to the *y* scale. |

## Line
The line mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| "auto" \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* - *auto* (default) - like *linear*, but use the (possibly spherical) projection, if any The *auto* curve is typically used in conjunction with a spherical projection to interpolate along geodesics. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The required horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The required vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate lines. If not specified, it defaults to **fill** if a channel, or **stroke** if a channel. |

## LineX
The lineX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| "auto" \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* - *auto* (default) - like *linear*, but use the (possibly spherical) projection, if any The *auto* curve is typically used in conjunction with a spherical projection to interpolate along geodesics. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The required horizontal position channel, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate lines. If not specified, it defaults to **fill** if a channel, or **stroke** if a channel. |

## LineY
The lineY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| "auto" \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. One of: - *basis* - a cubic basis spline (repeating the end points) - *basis-open* - an open cubic basis spline - *basis-closed* - a closed cubic basis spline - *bump-x* - a Bézier curve with horizontal tangents - *bump-y* - a Bézier curve with vertical tangents - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas) - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends) - *cardinal-open* - an open cubic cardinal spline - *cardinal-closed* - an closed cubic cardinal spline - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends) - *catmull-rom-open* - an open cubic Catmull–Rom spline - *catmull-rom-closed* - a closed cubic Catmull–Rom spline - *linear* - a piecewise linear curve (*i.e.*, straight line segments) - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments) - *monotone-x* - a cubic spline that preserves monotonicity in *x* - *monotone-y* - a cubic spline that preserves monotonicity in *y* - *natural* - a natural cubic spline - *step* - a piecewise constant function where *y* changes at the midpoint of *x* - *step-after* - a piecewise constant function where *y* changes after *x* - *step-before* - a piecewise constant function where *x* changes after *y* - *auto* (default) - like *linear*, but use the (possibly spherical) projection, if any The *auto* curve is typically used in conjunction with a spherical projection to interpolate along geodesics. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `y` | ChannelValueSpec |  | The required vertical position channel, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series to be drawn as separate lines. If not specified, it defaults to **fill** if a channel, or **stroke** if a channel. |

## Link
The link mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `curve` | Curve \| "auto" \| ParamRef \| ParamRef |  | The curve (interpolation) method for connecting adjacent points. Since a link has exactly two points, only the following curves (or a custom curve) are recommended: *linear*, *step*, *step-after*, *step-before*, *bump-x*, or *bump-y*. Note that the *linear* curve is incapable of showing a fill since a straight line has zero area. For a curved link, use an arrow mark with the **bend** option. If the plot uses a spherical **projection**, the default *auto* **curve** will render links as geodesics; to draw a straight line instead, use the *linear* **curve**. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `tension` | number \| ParamRef |  | The tension option only has an effect on bundle, cardinal and Catmull–Rom splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*, *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle splines, it corresponds to [beta][1]; for cardinal splines, [tension][2]; for Catmull–Rom splines, [alpha][3]. [1]: https://d3js.org/d3-shape/curve#curveBundle_beta [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha |
| `x` | ChannelValueSpec |  | The horizontal position, for vertical links; typically bound to the *x* scale; shorthand for setting defaults for both **x1** and **x2**. |
| `x1` | ChannelValueSpec |  | The starting horizontal position; typically bound to the *x* scale; also sets a default for **x2**. |
| `x2` | ChannelValueSpec |  | The ending horizontal position; typically bound to the *x* scale; also sets a default for **x1**. |
| `y` | ChannelValueSpec |  | The vertical position, for horizontal links; typically bound to the *y* scale; shorthand for setting defaults for both **y1** and **y2**. |
| `y1` | ChannelValueSpec |  | The starting vertical position; typically bound to the *y* scale; also sets a default for **y2**. |
| `y2` | ChannelValueSpec |  | The ending vertical position; typically bound to the *y* scale; also sets a default for **y1**. |

## Raster
The raster mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `imageRendering` | string \| ParamRef |  | The [image-rendering attribute][1]; defaults to *auto* (bilinear). The option may be set to *pixelated* to disable bilinear interpolation for a sharper image; however, note that this is not supported in WebKit. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |

## Heatmap
The heatmap mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `imageRendering` | string \| ParamRef |  | The [image-rendering attribute][1]; defaults to *auto* (bilinear). The option may be set to *pixelated* to disable bilinear interpolation for a sharper image; however, note that this is not supported in WebKit. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |

## RasterTile
The rasterTile mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `bandwidth` | number \| ParamRef |  | The kernel density bandwidth for smoothing, in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `height` | number \| ParamRef |  | The height (number of rows) of the grid, in actual pixels. |
| `imageRendering` | string \| ParamRef |  | The [image-rendering attribute][1]; defaults to *auto* (bilinear). The option may be set to *pixelated* to disable bilinear interpolation for a sharper image; however, note that this is not supported in WebKit. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/image-rendering |
| `interpolate` | GridInterpolate \| null \| ParamRef |  | The spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample |
| `origin` | number[] \| ParamRef |  | The coordinates of the tile origin in the **x** and **y** data domains. Defaults to [0, 0]. |
| `pad` | number \| ParamRef |  | The bin padding, one of 1 (default) to include extra padding for the final bin, or 0 to make the bins flush with the maximum domain value. |
| `pixelSize` | number \| ParamRef |  | The effective screen size of a raster pixel, used to determine the height and width of the raster from the frame’s dimensions; defaults to 1. |
| `width` | number \| ParamRef |  | The width (number of columns) of the grid, in actual pixels. |
| `x` | ChannelValueSpec |  | The horizontal position channel, typically bound to the *x* scale. Domain values are binned into a grid with *width* horizontal bins. |
| `y` | ChannelValueSpec |  | The vertical position channel, typically bound to the *y* scale. Domain values are binned into a grid with *height* vertical bins. |

## Rect
The rect mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for rectY, **y** for rectX, or both for rect) into an interval (**x1** and **x2** for rectY, or **y1** and **y2** for rectX, or both for rect); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for rectX, or stackY for rectY). |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueIntervalSpec |  | The horizontal position (or length/width) channel, typically bound to the *x* scale. If an **interval** is specified, then **x1** and **x2** are derived from **x**, representing the lower and upper bound of the containing interval, respectively. For example, for a vertical bar chart of items sold by day: ```js Plot.rectY(sales, {x: "date", interval: "day", y2: "items"}) ``` If *x* represents ordinal values, use a bar or cell mark instead. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `x2` | ChannelValueSpec |  | The required secondary (ending, often right) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `y` | ChannelValueIntervalSpec |  | The vertical position (or length/height) channel, typically bound to the *y* scale. If an **interval** is specified, then **y1** and **y2** are derived from **y**, representing the lower and upper bound of the containing interval, respectively. For example, for a horizontal bar chart of items sold by day: ```js Plot.rectX(sales, {y: "date", interval: "day", x2: "items"}) ``` If *y* represents ordinal values, use a bar or cell mark instead. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `y2` | ChannelValueSpec |  | The required secondary (ending, often top) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## RectX
The rectX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for rectY, **y** for rectX, or both for rect) into an interval (**x1** and **x2** for rectY, or **y1** and **y2** for rectX, or both for rect); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for rectX, or stackY for rectY). |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueSpec |  | The horizontal position (or length/width) channel, typically bound to the *x* scale. If neither **x1** nor **x2** is specified, an implicit stackX transform is applied and **x** defaults to the identity function, assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise, if only one of **x1** or **x2** is specified, the other defaults to **x**, which defaults to zero. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `x2` | ChannelValueSpec |  | The required secondary (ending, often right) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `y` | ChannelValueIntervalSpec |  | The vertical position (or length/height) channel, typically bound to the *y* scale. If an **interval** is specified, then **y1** and **y2** are derived from **y**, representing the lower and upper bound of the containing interval, respectively. For example, for a horizontal bar chart of items sold by day: ```js Plot.rectX(sales, {y: "date", interval: "day", x2: "items"}) ``` If *y* represents ordinal values, use a bar or cell mark instead. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `y2` | ChannelValueSpec |  | The required secondary (ending, often top) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## RectY
The rectY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for rectY, **y** for rectX, or both for rect) into an interval (**x1** and **x2** for rectY, or **y1** and **y2** for rectX, or both for rect); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for rectX, or stackY for rectY). |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `x` | ChannelValueIntervalSpec |  | The horizontal position (or length/width) channel, typically bound to the *x* scale. If an **interval** is specified, then **x1** and **x2** are derived from **x**, representing the lower and upper bound of the containing interval, respectively. For example, for a vertical bar chart of items sold by day: ```js Plot.rectY(sales, {x: "date", interval: "day", y2: "items"}) ``` If *x* represents ordinal values, use a bar or cell mark instead. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `x2` | ChannelValueSpec |  | The required secondary (ending, often right) horizontal position channel, typically bound to the *x* scale. Setting this option disables the rectX mark’s implicit stackX transform. If *x* represents ordinal values, use a bar or cell mark instead. |
| `y` | ChannelValueSpec |  | The vertical position (or length/height) channel, typically bound to the *y* scale. If neither **y1** nor **y2** is specified, an implicit stackY transform is applied and **y** defaults to the identity function, assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise, if only one of **y1** or **y2** is specified, the other defaults to **y**, which defaults to zero. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `y2` | ChannelValueSpec |  | The required secondary (ending, often top) vertical position channel, typically bound to the *y* scale. Setting this option disables the rectY mark’s implicit stackY transform. If *y* represents ordinal values, use a bar or cell mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## RegressionY
The regressionY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `ci` | number \| ParamRef |  | The confidence interval in (0, 1), or 0 to hide bands; defaults to 0.95. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `precision` | number \| ParamRef |  | The distance in pixels between samples of the confidence band; defaults to 4. |
| `x` | ChannelValueSpec |  | The independent variable horizontal position channel, typically bound to the *x* scale; defaults to the zero-based index of the data [0, 1, 2, …]. |
| `y` | ChannelValueSpec |  | The dependent variable vertical position channel, typically bound to the *y* scale; defaults to identity, assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into (possibly stacked) series, producing an independent regression for each group. If not specified, it defaults to **fill** if a channel, or **stroke** if a channel. |

## RuleX
The ruleX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData |  | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**y** for ruleX, or **x** for ruleY) into an interval (**y1** and **y2** for ruleX, or **x1** and **x2** for ruleY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec |  | The horizontal position of the tick; an optional channel bound to the *x* scale. If not specified, the rule will be horizontally centered in the plot’s frame. |
| `y` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary vertical position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `y1` | ChannelValueSpec |  | The primary (starting, often bottom) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |
| `y2` | ChannelValueSpec |  | The secondary (ending, often top) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |

## RuleY
The ruleY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData |  | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**y** for ruleX, or **x** for ruleY) into an interval (**y1** and **y2** for ruleX, or **x1** and **x2** for ruleY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec |  | The horizontal position of the tick; an optional channel bound to the *x* scale. If not specified, the rule will be horizontally centered in the plot’s frame. |
| `y` | ChannelValueIntervalSpec |  | Shorthand for specifying both the primary and secondary vertical position of the tick as the bounds of the containing interval; can only be used in conjunction with the **interval** option. |
| `y1` | ChannelValueSpec |  | The primary (starting, often bottom) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |
| `y2` | ChannelValueSpec |  | The secondary (ending, often top) vertical position of the tick; a channel bound to the *y* scale. If *y* represents ordinal values, use a tickX mark instead. |

## Text
The text mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData |  | The data source for the mark. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## TextX
The textX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData |  | The data source for the mark. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `interval` | Interval \| ParamRef |  | An interval (such as *day* or a number), to transform **y** values to the middle of the interval. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `x` | ChannelValueSpec |  | The horizontal position channel specifying the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueIntervalSpec |  | The vertical position of the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## TextY
The textY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData |  | The data source for the mark. |
| `fontFamily` | string \| ParamRef |  | The [font-family][1]; a constant; defaults to the plot’s font family, which is typically [*system-ui*][2]. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui |
| `fontSize` | ChannelValue \| ParamRef |  | The [font size][1] in pixels; either a constant or a channel; defaults to the plot’s font size, which is typically 10. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size |
| `fontStyle` | string \| ParamRef |  | The [font style][1]; a constant; defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style |
| `fontVariant` | string \| ParamRef |  | The [font variant][1]; a constant; if the **text** channel contains numbers or dates, defaults to *tabular-nums* to facilitate comparing numbers; otherwise defaults to the plot’s font style, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant |
| `fontWeight` | string \| number \| ParamRef |  | The [font weight][1]; a constant; defaults to the plot’s font weight, which is typically *normal*. [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The frame anchor specifies defaults for **x** and **y**, along with **textAnchor** and **lineAnchor**, based on the plot’s frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*), one of the four corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), or the *middle* of the frame. |
| `interval` | Interval |  | An interval (such as *day* or a number), to transform **x** values to the middle of the interval. |
| `lineAnchor` | "top" \| "middle" \| "bottom" \| ParamRef |  | The line anchor controls how text is aligned (typically vertically) relative to its anchor point; it is one of *top*, *bottom*, or *middle*. If the frame anchor is *top*, *top-left*, or *top-right*, the default line anchor is *top*; if the frame anchor is *bottom*, *bottom-right*, or *bottom-left*, the default is *bottom*; otherwise it is *middle*. |
| `lineHeight` | number \| ParamRef |  | The line height in ems; defaults to 1. The line height affects the (typically vertical) separation between adjacent baselines of text, as well as the separation between the text and its anchor point. |
| `lineWidth` | number \| ParamRef |  | The line width in ems (e.g., 10 for about 20 characters); defaults to infinity, disabling wrapping and clipping. If **textOverflow** is null, lines will be wrapped at the specified length. If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed at the end of the line. If **textOverflow** is not null, lines will be clipped according to the given strategy. |
| `monospace` | boolean \| ParamRef |  | If true, changes the default **fontFamily** to *monospace*, and uses simplified monospaced text metrics calculations. |
| `rotate` | ChannelValue \| ParamRef |  | The rotation angle in degrees clockwise; a constant or a channel; defaults to 0°. When a number, it is interpreted as a constant; otherwise it is interpreted as a channel. |
| `text` | ChannelValue |  | The text contents channel, possibly with line breaks (\n, \r\n, or \r). If not specified, defaults to the zero-based index [0, 1, 2, …]. |
| `textAnchor` | "start" \| "middle" \| "end" \| ParamRef |  | The [text anchor][1] controls how text is aligned (typically horizontally) relative to its anchor point; it is one of *start*, *end*, or *middle*. If the frame anchor is *left*, *top-left*, or *bottom-left*, the default text anchor is *start*; if the frame anchor is *right*, *top-right*, or *bottom-right*, the default is *end*; otherwise it is *middle*. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor |
| `textOverflow` | null \| "clip" \| "ellipsis" \| "clip-start" \| "clip-end" \| "ellipsis-start" \| "ellipsis-middle" \| "ellipsis-end" \| ParamRef |  | How truncate (or wrap) lines of text longer than the given **lineWidth**; one of: - null (default) - preserve overflowing characters (and wrap if needed) - *clip* or *clip-end* - remove characters from the end - *clip-start* - remove characters from the start - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…) - *ellipsis-start* - replace characters from the start with an ellipsis (…) - *ellipsis-middle* - replace characters from the middle with an ellipsis (…) If no **title** was specified, if text requires truncation, a title containing the non-truncated text will be implicitly added. |
| `x` | ChannelValueIntervalSpec |  | The horizontal position of the text’s anchor point, typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The vertical position channel specifying the text’s anchor point, typically bound to the *y* scale. |
| `z` | ChannelValue |  | An optional ordinal channel for grouping data into series. |

## TickX
The tickX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec |  | The required horizontal position of the tick; a channel typically bound to the *x* scale. |
| `y` | ChannelValueSpec |  | The optional vertical position of the tick; an ordinal channel typically bound to the *y* scale. If not specified, the tick spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a ruleX mark instead. |

## TickY
The tickY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `marker` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | Shorthand to set the same default for markerStart, markerMid, and markerEnd; one of: - a marker name such as *arrow* or *circle* - *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerEnd` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the ending point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `markerMid` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for any middle (interior) points of a line segment. If the line segment only has a start and end point, this option has no effect. One of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* * a function - a custom marker function; see below |
| `markerStart` | MarkerName \| "none" \| boolean \| null \| ParamRef |  | The marker for the starting point of a line segment; one of: - a marker name such as *arrow* or *circle* * *none* (default) - no marker * true - alias for *circle-fill* * false or null - alias for *none* |
| `x` | ChannelValueSpec |  | The optional horizontal position of the tick; an ordinal channel typically bound to the *x* scale. If not specified, the tick spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a ruleY mark instead. |
| `y` | ChannelValueSpec |  | The required vertical position of the tick; a channel typically bound to the *y* scale. |

## Vector
The vector mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "start" \| "middle" \| "end" \| ParamRef |  | The vector’s position along its orientation relative to its anchor point; a constant. Assuming a default **rotate** angle of 0°, one of: - *start* - from [*x*, *y*] to [*x*, *y* - *l*] - *middle* (default) - from [*x*, *y* + *l* / 2] to [*x*, *y* - *l* / 2] - *end* - from [*x*, *y* + *l*] to [*x*, *y*] where [*x*, *y*] is the vector’s anchor point and *l* is the vector’s (possibly scaled) length in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The vector’s frame anchor, to default **x** and **y** relative to the frame; a constant representing one of the frame corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), sides (*top*, *right*, *bottom*, *left*), or *middle* (default). Has no effect if both **x** and **y** are specified. |
| `length` | ChannelValueSpec |  | The vector’s length; either an optional channel bound to the *length* scale or a constant number in pixels. Defaults to 12 pixels. |
| `r` | number \| ParamRef |  | The vector shape’s radius, such as half the width of the *arrow*’s head or the *spike*’s base; a constant number in pixels. Defaults to 3.5 pixels. |
| `rotate` | ChannelValue |  | The vector’s orientation (rotation angle); either a constant number in degrees clockwise, or an optional channel (with no associated scale). Defaults to 0 degrees with the vector pointing up. |
| `shape` | VectorShape \| ParamRef |  | The shape of the vector; a constant. Defaults to *arrow*. |
| `x` | ChannelValueSpec |  | The horizontal position of the vector’s anchor point; an optional channel bound to the *x* scale. Default depends on the **frameAnchor**. |
| `y` | ChannelValueSpec |  | The vertical position of the vector’s anchor point; an optional channel bound to the *y* scale. Default depends on the **frameAnchor**. |

## VectorX
The vectorX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "start" \| "middle" \| "end" \| ParamRef |  | The vector’s position along its orientation relative to its anchor point; a constant. Assuming a default **rotate** angle of 0°, one of: - *start* - from [*x*, *y*] to [*x*, *y* - *l*] - *middle* (default) - from [*x*, *y* + *l* / 2] to [*x*, *y* - *l* / 2] - *end* - from [*x*, *y* + *l*] to [*x*, *y*] where [*x*, *y*] is the vector’s anchor point and *l* is the vector’s (possibly scaled) length in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The vector’s frame anchor, to default **x** and **y** relative to the frame; a constant representing one of the frame corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), sides (*top*, *right*, *bottom*, *left*), or *middle* (default). Has no effect if both **x** and **y** are specified. |
| `length` | ChannelValueSpec |  | The vector’s length; either an optional channel bound to the *length* scale or a constant number in pixels. Defaults to 12 pixels. |
| `r` | number \| ParamRef |  | The vector shape’s radius, such as half the width of the *arrow*’s head or the *spike*’s base; a constant number in pixels. Defaults to 3.5 pixels. |
| `rotate` | ChannelValue |  | The vector’s orientation (rotation angle); either a constant number in degrees clockwise, or an optional channel (with no associated scale). Defaults to 0 degrees with the vector pointing up. |
| `shape` | VectorShape \| ParamRef |  | The shape of the vector; a constant. Defaults to *arrow*. |
| `x` | ChannelValueSpec |  | The horizontal position of the vector’s anchor point; an optional channel bound to the *x* scale. Default depends on the **frameAnchor**. |
| `y` | ChannelValueSpec |  | The vertical position of the vector’s anchor point; an optional channel bound to the *y* scale. Default depends on the **frameAnchor**. |

## VectorY
The vectorY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "start" \| "middle" \| "end" \| ParamRef |  | The vector’s position along its orientation relative to its anchor point; a constant. Assuming a default **rotate** angle of 0°, one of: - *start* - from [*x*, *y*] to [*x*, *y* - *l*] - *middle* (default) - from [*x*, *y* + *l* / 2] to [*x*, *y* - *l* / 2] - *end* - from [*x*, *y* + *l*] to [*x*, *y*] where [*x*, *y*] is the vector’s anchor point and *l* is the vector’s (possibly scaled) length in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The vector’s frame anchor, to default **x** and **y** relative to the frame; a constant representing one of the frame corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), sides (*top*, *right*, *bottom*, *left*), or *middle* (default). Has no effect if both **x** and **y** are specified. |
| `length` | ChannelValueSpec |  | The vector’s length; either an optional channel bound to the *length* scale or a constant number in pixels. Defaults to 12 pixels. |
| `r` | number \| ParamRef |  | The vector shape’s radius, such as half the width of the *arrow*’s head or the *spike*’s base; a constant number in pixels. Defaults to 3.5 pixels. |
| `rotate` | ChannelValue |  | The vector’s orientation (rotation angle); either a constant number in degrees clockwise, or an optional channel (with no associated scale). Defaults to 0 degrees with the vector pointing up. |
| `shape` | VectorShape \| ParamRef |  | The shape of the vector; a constant. Defaults to *arrow*. |
| `x` | ChannelValueSpec |  | The horizontal position of the vector’s anchor point; an optional channel bound to the *x* scale. Default depends on the **frameAnchor**. |
| `y` | ChannelValueSpec |  | The vertical position of the vector’s anchor point; an optional channel bound to the *y* scale. Default depends on the **frameAnchor**. |

## Spike
The spike mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `anchor` | "start" \| "middle" \| "end" \| ParamRef |  | The vector’s position along its orientation relative to its anchor point; a constant. Assuming a default **rotate** angle of 0°, one of: - *start* - from [*x*, *y*] to [*x*, *y* - *l*] - *middle* (default) - from [*x*, *y* + *l* / 2] to [*x*, *y* - *l* / 2] - *end* - from [*x*, *y* + *l*] to [*x*, *y*] where [*x*, *y*] is the vector’s anchor point and *l* is the vector’s (possibly scaled) length in pixels. |
| `data` | PlotMarkData | yes | The data source for the mark. |
| `frameAnchor` | FrameAnchor \| ParamRef |  | The vector’s frame anchor, to default **x** and **y** relative to the frame; a constant representing one of the frame corners (*top-left*, *top-right*, *bottom-right*, *bottom-left*), sides (*top*, *right*, *bottom*, *left*), or *middle* (default). Has no effect if both **x** and **y** are specified. |
| `length` | ChannelValueSpec |  | The vector’s length; either an optional channel bound to the *length* scale or a constant number in pixels. Defaults to 12 pixels. |
| `r` | number \| ParamRef |  | The vector shape’s radius, such as half the width of the *arrow*’s head or the *spike*’s base; a constant number in pixels. Defaults to 3.5 pixels. |
| `rotate` | ChannelValue |  | The vector’s orientation (rotation angle); either a constant number in degrees clockwise, or an optional channel (with no associated scale). Defaults to 0 degrees with the vector pointing up. |
| `shape` | VectorShape \| ParamRef |  | The shape of the vector; a constant. Defaults to *arrow*. |
| `x` | ChannelValueSpec |  | The horizontal position of the vector’s anchor point; an optional channel bound to the *x* scale. Default depends on the **frameAnchor**. |
| `y` | ChannelValueSpec |  | The vertical position of the vector’s anchor point; an optional channel bound to the *y* scale. Default depends on the **frameAnchor**. |

## WaffleX
The waffleX mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `gap` | number \| ParamRef |  | The gap in pixels between cells; defaults to 1. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for barX, or **y** for barY) into an interval (**x1** and **x2** for barX, or **y1** and **y2** for barY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for barX, or stackY for barY). |
| `multiple` | number \| ParamRef |  | The number of cells per row or column; defaults to undefined for automatic. |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `round` | boolean \| ParamRef |  | If true, round to integers to avoid partial cells. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `unit` | number \| ParamRef |  | The quantity each cell represents; defaults to 1. |
| `x` | ChannelValueIntervalSpec |  | The horizontal position (or length/width) channel, typically bound to the *x* scale. If neither **x1** nor **x2** nor **interval** is specified, an implicit stackX transform is applied and **x** defaults to the identity function, assuming that *data* = [*x₀*, *x₁*, *x₂*, …]. Otherwise if an **interval** is specified, then **x1** and **x2** are derived from **x**, representing the lower and upper bound of the containing interval, respectively. Otherwise, if only one of **x1** or **x2** is specified, the other defaults to **x**, which defaults to zero. |
| `x1` | ChannelValueSpec |  | The required primary (starting, often left) horizontal position channel, typically bound to the *x* scale. Setting this option disables the implicit stackX transform. If *x* represents ordinal values, use a cell mark instead. |
| `x2` | ChannelValueSpec |  | The required secondary (ending, often right) horizontal position channel, typically bound to the *x* scale. Setting this option disables the implicit stackX transform. If *x* represents ordinal values, use a cell mark instead. |
| `y` | ChannelValueSpec |  | The optional vertical position of the bar; a ordinal channel typically bound to the *y* scale. If not specified, the bar spans the vertical extent of the frame; otherwise the *y* scale must be a *band* scale. If *y* represents quantitative or temporal values, use a rectX mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## WaffleY
The waffleY mark.

Inherits all [common mark options](#common-mark-options).

| Option | Type | Required | Description |
|---|---|---|---|
| `data` | PlotMarkData | yes | The data source for the mark. |
| `gap` | number \| ParamRef |  | The gap in pixels between cells; defaults to 1. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `insetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `insetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `insetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `insetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `interval` | Interval \| ParamRef |  | How to convert a continuous value (**x** for barX, or **y** for barY) into an interval (**x1** and **x2** for barX, or **y1** and **y2** for barY); one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n* Setting this option disables the implicit stack transform (stackX for barX, or stackY for barY). |
| `multiple` | number \| ParamRef |  | The number of cells per row or column; defaults to undefined for automatic. |
| `offset` | StackOffset \| null \| ParamRef |  | After stacking, an optional **offset** can be applied to translate and scale stacks, say to produce a streamgraph; defaults to null for a zero baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle* offset is used, the default **order** changes to *inside-out*. |
| `order` | StackOrder \| null \| ParamRef |  | The order in which stacks are layered; one of: - null (default) for input order - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - a function of data, for natural order of the corresponding values - an array of explicit **z** values in the desired order If the *wiggle* **offset** is used, as for a streamgraph, the default changes to *inside-out*. |
| `round` | boolean \| ParamRef |  | If true, round to integers to avoid partial cells. |
| `rx` | number \| string \| ParamRef |  | The rounded corner [*x*-radius][1], either in pixels or as a percentage of the rect width. If **rx** is not specified, it defaults to **ry** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/rx |
| `ry` | number \| string \| ParamRef |  | The rounded corner [*y*-radius][1], either in pixels or as a percentage of the rect height. If **ry** is not specified, it defaults to **rx** if present, and otherwise draws square corners. [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/ry |
| `unit` | number \| ParamRef |  | The quantity each cell represents; defaults to 1. |
| `x` | ChannelValueSpec |  | The optional horizontal position of the bar; a ordinal channel typically bound to the *x* scale. If not specified, the bar spans the horizontal extent of the frame; otherwise the *x* scale must be a *band* scale. If *x* represents quantitative or temporal values, use a rectY mark instead. |
| `y` | ChannelValueIntervalSpec |  | The vertical position (or length/height) channel, typically bound to the *y* scale. If neither **y1** nor **y2** nor **interval** is specified, an implicit stackY transform is applied and **y** defaults to the identity function, assuming that *data* = [*y₀*, *y₁*, *y₂*, …]. Otherwise if an **interval** is specified, then **y1** and **y2** are derived from **y**, representing the lower and upper bound of the containing interval, respectively. Otherwise, if only one of **y1** or **y2** is specified, the other defaults to **y**, which defaults to zero. |
| `y1` | ChannelValueSpec |  | The required primary (starting, often bottom) vertical position channel, typically bound to the *y* scale. Setting this option disables the implicit stackY transform. If *y* represents ordinal values, use a cell mark instead. |
| `y2` | ChannelValueSpec |  | The required secondary (ending, often top) horizontal position channel, typically bound to the *y* scale. Setting this option disables the implicit stackY transform. If *y* represents ordinal values, use a cell mark instead. |
| `z` | ChannelValue |  | The **z** channel defines the series of each value in the stack. Used when the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of **z** values. |

## Other definitions

## AggregateExpression
A custom SQL aggregate expression.


| Option | Type | Required | Description |
|---|---|---|---|
| `agg` | string | yes | A SQL expression string to calculate an aggregate value. Embedded Param references, such as `SUM($param + 1)`, are supported. For expressions without aggregate functions, use *sql* instead. |
| `label` | string |  | A label for this expression, for example to label a plot axis. |

## AggregateTransform
An aggregate transform that combines multiple values.

Type: `Argmax | Argmin | Avg | Count | Max | Min | First | Last | Median | Mode | Product | Quantile | Stddev | StddevPop | Sum | Variance | VarPop`

## Argmax
An argmax aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `argmax` | string \| number \| boolean \| ParamRef[] | yes | Find a value of the first column that maximizes the second column. |
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Argmin
An argmin aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `argmin` | string \| number \| boolean \| ParamRef[] | yes | Find a value of the first column that minimizes the second column. |
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Avg
An avg (average, or mean) aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `avg` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the average (mean) value of the given column. |
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Bin
A bin transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `bin` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Bin a continuous variable into discrete intervals. The bin argument specifies a data column or expression to bin. Both numerical and temporal (date/time) values are supported. |
| `interval` | BinInterval |  | The interval bin unit to use, typically used to indicate a date/time unit for binning temporal values, such as `hour`, `day`, or `month`. If `date`, the extent of data values is used to automatically select an interval for temporal data. The value `number` enforces normal numerical binning, even over temporal data. If unspecified, defaults to `number` for numerical data and `date` for temporal data. |
| `minstep` | number |  | The minimum allowed bin step size (default `0`) when performing numerical binning. For example, a setting of `1` prevents step sizes less than 1. This option is ignored when **step** is specified. |
| `nice` | true |  | A flag (default `true`) requesting "nice" human-friendly end points and step sizes when performing numerical binning. When **step** is specified, this option affects the binning end points (e.g., origin) only. |
| `offset` | number |  | Offset for computed bins (default `0`). For example, a value of `1` will result in using the next consecutive bin boundary. |
| `step` | number |  | The step size to use between bins. When binning numerical values (or interval type `number`), this setting specifies the numerical step size. For data/time intervals, this indicates the number of steps of that unit, such as hours, days, or years. |
| `steps` | number |  | The target number of binning steps to use. To accommodate human-friendly ("nice") bin boundaries, the actual number of bins may diverge from this exact value. This option is ignored when **step** is specified. |

## BinInterval
Binning interval names.

Type: `"date" | "number" | "millisecond" | "second" | "minute" | "hour" | "day" | "month" | "year"`

## BrushStyles
Styles for rectangular selection brushes.


| Option | Type | Required | Description |
|---|---|---|---|
| `fill` | string |  | The fill color of the brush rectangle. |
| `fillOpacity` | number |  | The fill opacity of the brush rectangle. |
| `opacity` | number |  | The overall opacity of the brush rectangle. |
| `stroke` | string |  | The stroke color of the brush rectangle. |
| `strokeDasharray` | string |  | The stroke dash array of the brush rectangle. |
| `strokeOpacity` | number |  | The stroke opacity of the brush rectangle. |

## CSSStyles


| Option | Type | Required | Description |
|---|---|---|---|
| `accentColor` | string |  |  |
| `alignContent` | string |  |  |
| `alignItems` | string |  |  |
| `alignSelf` | string |  |  |
| `alignmentBaseline` | string |  |  |
| `all` | string |  |  |
| `animation` | string |  |  |
| `animationComposition` | string |  |  |
| `animationDelay` | string |  |  |
| `animationDirection` | string |  |  |
| `animationDuration` | string |  |  |
| `animationFillMode` | string |  |  |
| `animationIterationCount` | string |  |  |
| `animationName` | string |  |  |
| `animationPlayState` | string |  |  |
| `animationTimingFunction` | string |  |  |
| `appearance` | string |  |  |
| `aspectRatio` | string |  |  |
| `backdropFilter` | string |  |  |
| `backfaceVisibility` | string |  |  |
| `background` | string |  |  |
| `backgroundAttachment` | string |  |  |
| `backgroundBlendMode` | string |  |  |
| `backgroundClip` | string |  |  |
| `backgroundColor` | string |  |  |
| `backgroundImage` | string |  |  |
| `backgroundOrigin` | string |  |  |
| `backgroundPosition` | string |  |  |
| `backgroundPositionX` | string |  |  |
| `backgroundPositionY` | string |  |  |
| `backgroundRepeat` | string |  |  |
| `backgroundSize` | string |  |  |
| `baselineShift` | string |  |  |
| `baselineSource` | string |  |  |
| `blockSize` | string |  |  |
| `border` | string |  |  |
| `borderBlock` | string |  |  |
| `borderBlockColor` | string |  |  |
| `borderBlockEnd` | string |  |  |
| `borderBlockEndColor` | string |  |  |
| `borderBlockEndStyle` | string |  |  |
| `borderBlockEndWidth` | string |  |  |
| `borderBlockStart` | string |  |  |
| `borderBlockStartColor` | string |  |  |
| `borderBlockStartStyle` | string |  |  |
| `borderBlockStartWidth` | string |  |  |
| `borderBlockStyle` | string |  |  |
| `borderBlockWidth` | string |  |  |
| `borderBottom` | string |  |  |
| `borderBottomColor` | string |  |  |
| `borderBottomLeftRadius` | string |  |  |
| `borderBottomRightRadius` | string |  |  |
| `borderBottomStyle` | string |  |  |
| `borderBottomWidth` | string |  |  |
| `borderCollapse` | string |  |  |
| `borderColor` | string |  |  |
| `borderEndEndRadius` | string |  |  |
| `borderEndStartRadius` | string |  |  |
| `borderImage` | string |  |  |
| `borderImageOutset` | string |  |  |
| `borderImageRepeat` | string |  |  |
| `borderImageSlice` | string |  |  |
| `borderImageSource` | string |  |  |
| `borderImageWidth` | string |  |  |
| `borderInline` | string |  |  |
| `borderInlineColor` | string |  |  |
| `borderInlineEnd` | string |  |  |
| `borderInlineEndColor` | string |  |  |
| `borderInlineEndStyle` | string |  |  |
| `borderInlineEndWidth` | string |  |  |
| `borderInlineStart` | string |  |  |
| `borderInlineStartColor` | string |  |  |
| `borderInlineStartStyle` | string |  |  |
| `borderInlineStartWidth` | string |  |  |
| `borderInlineStyle` | string |  |  |
| `borderInlineWidth` | string |  |  |
| `borderLeft` | string |  |  |
| `borderLeftColor` | string |  |  |
| `borderLeftStyle` | string |  |  |
| `borderLeftWidth` | string |  |  |
| `borderRadius` | string |  |  |
| `borderRight` | string |  |  |
| `borderRightColor` | string |  |  |
| `borderRightStyle` | string |  |  |
| `borderRightWidth` | string |  |  |
| `borderSpacing` | string |  |  |
| `borderStartEndRadius` | string |  |  |
| `borderStartStartRadius` | string |  |  |
| `borderStyle` | string |  |  |
| `borderTop` | string |  |  |
| `borderTopColor` | string |  |  |
| `borderTopLeftRadius` | string |  |  |
| `borderTopRightRadius` | string |  |  |
| `borderTopStyle` | string |  |  |
| `borderTopWidth` | string |  |  |
| `borderWidth` | string |  |  |
| `bottom` | string |  |  |
| `boxDecorationBreak` | string |  |  |
| `boxShadow` | string |  |  |
| `boxSizing` | string |  |  |
| `breakAfter` | string |  |  |
| `breakBefore` | string |  |  |
| `breakInside` | string |  |  |
| `captionSide` | string |  |  |
| `caretColor` | string |  |  |
| `clear` | string |  |  |
| `clip` | string |  |  |
| `clipPath` | string |  |  |
| `clipRule` | string |  |  |
| `color` | string |  |  |
| `colorInterpolation` | string |  |  |
| `colorInterpolationFilters` | string |  |  |
| `colorScheme` | string |  |  |
| `columnCount` | string |  |  |
| `columnFill` | string |  |  |
| `columnGap` | string |  |  |
| `columnRule` | string |  |  |
| `columnRuleColor` | string |  |  |
| `columnRuleStyle` | string |  |  |
| `columnRuleWidth` | string |  |  |
| `columnSpan` | string |  |  |
| `columnWidth` | string |  |  |
| `columns` | string |  |  |
| `contain` | string |  |  |
| `containIntrinsicBlockSize` | string |  |  |
| `containIntrinsicHeight` | string |  |  |
| `containIntrinsicInlineSize` | string |  |  |
| `containIntrinsicSize` | string |  |  |
| `containIntrinsicWidth` | string |  |  |
| `container` | string |  |  |
| `containerName` | string |  |  |
| `containerType` | string |  |  |
| `content` | string |  |  |
| `contentVisibility` | string |  |  |
| `counterIncrement` | string |  |  |
| `counterReset` | string |  |  |
| `counterSet` | string |  |  |
| `cssFloat` | string |  |  |
| `cssText` | string |  |  |
| `cursor` | string |  |  |
| `cx` | string |  |  |
| `cy` | string |  |  |
| `d` | string |  |  |
| `direction` | string |  |  |
| `display` | string |  |  |
| `dominantBaseline` | string |  |  |
| `emptyCells` | string |  |  |
| `fill` | string |  |  |
| `fillOpacity` | string |  |  |
| `fillRule` | string |  |  |
| `filter` | string |  |  |
| `flex` | string |  |  |
| `flexBasis` | string |  |  |
| `flexDirection` | string |  |  |
| `flexFlow` | string |  |  |
| `flexGrow` | string |  |  |
| `flexShrink` | string |  |  |
| `flexWrap` | string |  |  |
| `float` | string |  |  |
| `floodColor` | string |  |  |
| `floodOpacity` | string |  |  |
| `font` | string |  |  |
| `fontFamily` | string |  |  |
| `fontFeatureSettings` | string |  |  |
| `fontKerning` | string |  |  |
| `fontOpticalSizing` | string |  |  |
| `fontPalette` | string |  |  |
| `fontSize` | string |  |  |
| `fontSizeAdjust` | string |  |  |
| `fontStretch` | string |  |  |
| `fontStyle` | string |  |  |
| `fontSynthesis` | string |  |  |
| `fontSynthesisSmallCaps` | string |  |  |
| `fontSynthesisStyle` | string |  |  |
| `fontSynthesisWeight` | string |  |  |
| `fontVariant` | string |  |  |
| `fontVariantAlternates` | string |  |  |
| `fontVariantCaps` | string |  |  |
| `fontVariantEastAsian` | string |  |  |
| `fontVariantLigatures` | string |  |  |
| `fontVariantNumeric` | string |  |  |
| `fontVariantPosition` | string |  |  |
| `fontVariationSettings` | string |  |  |
| `fontWeight` | string |  |  |
| `forcedColorAdjust` | string |  |  |
| `gap` | string |  |  |
| `grid` | string |  |  |
| `gridArea` | string |  |  |
| `gridAutoColumns` | string |  |  |
| `gridAutoFlow` | string |  |  |
| `gridAutoRows` | string |  |  |
| `gridColumn` | string |  |  |
| `gridColumnEnd` | string |  |  |
| `gridColumnGap` | string |  |  |
| `gridColumnStart` | string |  |  |
| `gridGap` | string |  |  |
| `gridRow` | string |  |  |
| `gridRowEnd` | string |  |  |
| `gridRowGap` | string |  |  |
| `gridRowStart` | string |  |  |
| `gridTemplate` | string |  |  |
| `gridTemplateAreas` | string |  |  |
| `gridTemplateColumns` | string |  |  |
| `gridTemplateRows` | string |  |  |
| `height` | string |  |  |
| `hyphenateCharacter` | string |  |  |
| `hyphenateLimitChars` | string |  |  |
| `hyphens` | string |  |  |
| `imageOrientation` | string |  |  |
| `imageRendering` | string |  |  |
| `inlineSize` | string |  |  |
| `inset` | string |  |  |
| `insetBlock` | string |  |  |
| `insetBlockEnd` | string |  |  |
| `insetBlockStart` | string |  |  |
| `insetInline` | string |  |  |
| `insetInlineEnd` | string |  |  |
| `insetInlineStart` | string |  |  |
| `isolation` | string |  |  |
| `justifyContent` | string |  |  |
| `justifyItems` | string |  |  |
| `justifySelf` | string |  |  |
| `left` | string |  |  |
| `length` | number |  |  |
| `letterSpacing` | string |  |  |
| `lightingColor` | string |  |  |
| `lineBreak` | string |  |  |
| `lineHeight` | string |  |  |
| `listStyle` | string |  |  |
| `listStyleImage` | string |  |  |
| `listStylePosition` | string |  |  |
| `listStyleType` | string |  |  |
| `margin` | string |  |  |
| `marginBlock` | string |  |  |
| `marginBlockEnd` | string |  |  |
| `marginBlockStart` | string |  |  |
| `marginBottom` | string |  |  |
| `marginInline` | string |  |  |
| `marginInlineEnd` | string |  |  |
| `marginInlineStart` | string |  |  |
| `marginLeft` | string |  |  |
| `marginRight` | string |  |  |
| `marginTop` | string |  |  |
| `marker` | string |  |  |
| `markerEnd` | string |  |  |
| `markerMid` | string |  |  |
| `markerStart` | string |  |  |
| `mask` | string |  |  |
| `maskClip` | string |  |  |
| `maskComposite` | string |  |  |
| `maskImage` | string |  |  |
| `maskMode` | string |  |  |
| `maskOrigin` | string |  |  |
| `maskPosition` | string |  |  |
| `maskRepeat` | string |  |  |
| `maskSize` | string |  |  |
| `maskType` | string |  |  |
| `mathDepth` | string |  |  |
| `mathStyle` | string |  |  |
| `maxBlockSize` | string |  |  |
| `maxHeight` | string |  |  |
| `maxInlineSize` | string |  |  |
| `maxWidth` | string |  |  |
| `minBlockSize` | string |  |  |
| `minHeight` | string |  |  |
| `minInlineSize` | string |  |  |
| `minWidth` | string |  |  |
| `mixBlendMode` | string |  |  |
| `objectFit` | string |  |  |
| `objectPosition` | string |  |  |
| `offset` | string |  |  |
| `offsetAnchor` | string |  |  |
| `offsetDistance` | string |  |  |
| `offsetPath` | string |  |  |
| `offsetPosition` | string |  |  |
| `offsetRotate` | string |  |  |
| `opacity` | string |  |  |
| `order` | string |  |  |
| `orphans` | string |  |  |
| `outline` | string |  |  |
| `outlineColor` | string |  |  |
| `outlineOffset` | string |  |  |
| `outlineStyle` | string |  |  |
| `outlineWidth` | string |  |  |
| `overflow` | string |  |  |
| `overflowAnchor` | string |  |  |
| `overflowBlock` | string |  |  |
| `overflowClipMargin` | string |  |  |
| `overflowInline` | string |  |  |
| `overflowWrap` | string |  |  |
| `overflowX` | string |  |  |
| `overflowY` | string |  |  |
| `overscrollBehavior` | string |  |  |
| `overscrollBehaviorBlock` | string |  |  |
| `overscrollBehaviorInline` | string |  |  |
| `overscrollBehaviorX` | string |  |  |
| `overscrollBehaviorY` | string |  |  |
| `padding` | string |  |  |
| `paddingBlock` | string |  |  |
| `paddingBlockEnd` | string |  |  |
| `paddingBlockStart` | string |  |  |
| `paddingBottom` | string |  |  |
| `paddingInline` | string |  |  |
| `paddingInlineEnd` | string |  |  |
| `paddingInlineStart` | string |  |  |
| `paddingLeft` | string |  |  |
| `paddingRight` | string |  |  |
| `paddingTop` | string |  |  |
| `page` | string |  |  |
| `pageBreakAfter` | string |  |  |
| `pageBreakBefore` | string |  |  |
| `pageBreakInside` | string |  |  |
| `paintOrder` | string |  |  |
| `perspective` | string |  |  |
| `perspectiveOrigin` | string |  |  |
| `placeContent` | string |  |  |
| `placeItems` | string |  |  |
| `placeSelf` | string |  |  |
| `pointerEvents` | string |  |  |
| `position` | string |  |  |
| `printColorAdjust` | string |  |  |
| `quotes` | string |  |  |
| `r` | string |  |  |
| `resize` | string |  |  |
| `right` | string |  |  |
| `rotate` | string |  |  |
| `rowGap` | string |  |  |
| `rubyAlign` | string |  |  |
| `rubyPosition` | string |  |  |
| `rx` | string |  |  |
| `ry` | string |  |  |
| `scale` | string |  |  |
| `scrollBehavior` | string |  |  |
| `scrollMargin` | string |  |  |
| `scrollMarginBlock` | string |  |  |
| `scrollMarginBlockEnd` | string |  |  |
| `scrollMarginBlockStart` | string |  |  |
| `scrollMarginBottom` | string |  |  |
| `scrollMarginInline` | string |  |  |
| `scrollMarginInlineEnd` | string |  |  |
| `scrollMarginInlineStart` | string |  |  |
| `scrollMarginLeft` | string |  |  |
| `scrollMarginRight` | string |  |  |
| `scrollMarginTop` | string |  |  |
| `scrollPadding` | string |  |  |
| `scrollPaddingBlock` | string |  |  |
| `scrollPaddingBlockEnd` | string |  |  |
| `scrollPaddingBlockStart` | string |  |  |
| `scrollPaddingBottom` | string |  |  |
| `scrollPaddingInline` | string |  |  |
| `scrollPaddingInlineEnd` | string |  |  |
| `scrollPaddingInlineStart` | string |  |  |
| `scrollPaddingLeft` | string |  |  |
| `scrollPaddingRight` | string |  |  |
| `scrollPaddingTop` | string |  |  |
| `scrollSnapAlign` | string |  |  |
| `scrollSnapStop` | string |  |  |
| `scrollSnapType` | string |  |  |
| `scrollbarColor` | string |  |  |
| `scrollbarGutter` | string |  |  |
| `scrollbarWidth` | string |  |  |
| `shapeImageThreshold` | string |  |  |
| `shapeMargin` | string |  |  |
| `shapeOutside` | string |  |  |
| `shapeRendering` | string |  |  |
| `stopColor` | string |  |  |
| `stopOpacity` | string |  |  |
| `stroke` | string |  |  |
| `strokeDasharray` | string |  |  |
| `strokeDashoffset` | string |  |  |
| `strokeLinecap` | string |  |  |
| `strokeLinejoin` | string |  |  |
| `strokeMiterlimit` | string |  |  |
| `strokeOpacity` | string |  |  |
| `strokeWidth` | string |  |  |
| `tabSize` | string |  |  |
| `tableLayout` | string |  |  |
| `textAlign` | string |  |  |
| `textAlignLast` | string |  |  |
| `textAnchor` | string |  |  |
| `textBox` | string |  |  |
| `textBoxEdge` | string |  |  |
| `textBoxTrim` | string |  |  |
| `textCombineUpright` | string |  |  |
| `textDecoration` | string |  |  |
| `textDecorationColor` | string |  |  |
| `textDecorationLine` | string |  |  |
| `textDecorationSkipInk` | string |  |  |
| `textDecorationStyle` | string |  |  |
| `textDecorationThickness` | string |  |  |
| `textEmphasis` | string |  |  |
| `textEmphasisColor` | string |  |  |
| `textEmphasisPosition` | string |  |  |
| `textEmphasisStyle` | string |  |  |
| `textIndent` | string |  |  |
| `textOrientation` | string |  |  |
| `textOverflow` | string |  |  |
| `textRendering` | string |  |  |
| `textShadow` | string |  |  |
| `textTransform` | string |  |  |
| `textUnderlineOffset` | string |  |  |
| `textUnderlinePosition` | string |  |  |
| `textWrap` | string |  |  |
| `textWrapMode` | string |  |  |
| `textWrapStyle` | string |  |  |
| `top` | string |  |  |
| `touchAction` | string |  |  |
| `transform` | string |  |  |
| `transformBox` | string |  |  |
| `transformOrigin` | string |  |  |
| `transformStyle` | string |  |  |
| `transition` | string |  |  |
| `transitionBehavior` | string |  |  |
| `transitionDelay` | string |  |  |
| `transitionDuration` | string |  |  |
| `transitionProperty` | string |  |  |
| `transitionTimingFunction` | string |  |  |
| `translate` | string |  |  |
| `unicodeBidi` | string |  |  |
| `userSelect` | string |  |  |
| `vectorEffect` | string |  |  |
| `verticalAlign` | string |  |  |
| `viewTransitionClass` | string |  |  |
| `viewTransitionName` | string |  |  |
| `visibility` | string |  |  |
| `webkitAlignContent` | string |  |  |
| `webkitAlignItems` | string |  |  |
| `webkitAlignSelf` | string |  |  |
| `webkitAnimation` | string |  |  |
| `webkitAnimationDelay` | string |  |  |
| `webkitAnimationDirection` | string |  |  |
| `webkitAnimationDuration` | string |  |  |
| `webkitAnimationFillMode` | string |  |  |
| `webkitAnimationIterationCount` | string |  |  |
| `webkitAnimationName` | string |  |  |
| `webkitAnimationPlayState` | string |  |  |
| `webkitAnimationTimingFunction` | string |  |  |
| `webkitAppearance` | string |  |  |
| `webkitBackfaceVisibility` | string |  |  |
| `webkitBackgroundClip` | string |  |  |
| `webkitBackgroundOrigin` | string |  |  |
| `webkitBackgroundSize` | string |  |  |
| `webkitBorderBottomLeftRadius` | string |  |  |
| `webkitBorderBottomRightRadius` | string |  |  |
| `webkitBorderRadius` | string |  |  |
| `webkitBorderTopLeftRadius` | string |  |  |
| `webkitBorderTopRightRadius` | string |  |  |
| `webkitBoxAlign` | string |  |  |
| `webkitBoxFlex` | string |  |  |
| `webkitBoxOrdinalGroup` | string |  |  |
| `webkitBoxOrient` | string |  |  |
| `webkitBoxPack` | string |  |  |
| `webkitBoxShadow` | string |  |  |
| `webkitBoxSizing` | string |  |  |
| `webkitFilter` | string |  |  |
| `webkitFlex` | string |  |  |
| `webkitFlexBasis` | string |  |  |
| `webkitFlexDirection` | string |  |  |
| `webkitFlexFlow` | string |  |  |
| `webkitFlexGrow` | string |  |  |
| `webkitFlexShrink` | string |  |  |
| `webkitFlexWrap` | string |  |  |
| `webkitJustifyContent` | string |  |  |
| `webkitLineClamp` | string |  |  |
| `webkitMask` | string |  |  |
| `webkitMaskBoxImage` | string |  |  |
| `webkitMaskBoxImageOutset` | string |  |  |
| `webkitMaskBoxImageRepeat` | string |  |  |
| `webkitMaskBoxImageSlice` | string |  |  |
| `webkitMaskBoxImageSource` | string |  |  |
| `webkitMaskBoxImageWidth` | string |  |  |
| `webkitMaskClip` | string |  |  |
| `webkitMaskComposite` | string |  |  |
| `webkitMaskImage` | string |  |  |
| `webkitMaskOrigin` | string |  |  |
| `webkitMaskPosition` | string |  |  |
| `webkitMaskRepeat` | string |  |  |
| `webkitMaskSize` | string |  |  |
| `webkitOrder` | string |  |  |
| `webkitPerspective` | string |  |  |
| `webkitPerspectiveOrigin` | string |  |  |
| `webkitTextFillColor` | string |  |  |
| `webkitTextSizeAdjust` | string |  |  |
| `webkitTextStroke` | string |  |  |
| `webkitTextStrokeColor` | string |  |  |
| `webkitTextStrokeWidth` | string |  |  |
| `webkitTransform` | string |  |  |
| `webkitTransformOrigin` | string |  |  |
| `webkitTransformStyle` | string |  |  |
| `webkitTransition` | string |  |  |
| `webkitTransitionDelay` | string |  |  |
| `webkitTransitionDuration` | string |  |  |
| `webkitTransitionProperty` | string |  |  |
| `webkitTransitionTimingFunction` | string |  |  |
| `webkitUserSelect` | string |  |  |
| `whiteSpace` | string |  |  |
| `whiteSpaceCollapse` | string |  |  |
| `widows` | string |  |  |
| `width` | string |  |  |
| `willChange` | string |  |  |
| `wordBreak` | string |  |  |
| `wordSpacing` | string |  |  |
| `wordWrap` | string |  |  |
| `writingMode` | string |  |  |
| `x` | string |  |  |
| `y` | string |  |  |
| `zIndex` | string |  |  |
| `zoom` | string |  |  |

## Centroid
A centroid transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `centroid` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the 2D centroid of geometry-typed data. This transform requires the DuckDB `spatial` extension. |

## CentroidX
A centroidX transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `centroidX` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the centroid x-coordinate of geometry-typed data. This transform requires the DuckDB `spatial` extension. |

## CentroidY
A centroidY transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `centroidY` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the centroid y-coordinate of geometry-typed data. This transform requires the DuckDB `spatial` extension. |

## ChannelDomainSort
How to impute scale domains from channel values.


| Option | Type | Required | Description |
|---|---|---|---|
| `color` | ChannelDomainValueSpec |  |  |
| `fx` | ChannelDomainValueSpec |  |  |
| `fy` | ChannelDomainValueSpec |  |  |
| `length` | ChannelDomainValueSpec |  |  |
| `limit` | number \| object[] |  | If a positive number, limit the domain to the first *n* sorted values. If a negative number, limit the domain to the last *-n* sorted values. Hence, a positive **limit** with **reverse** true will return the top *n* values in descending order. If an array [*lo*, *hi*], slices the sorted domain from *lo* (inclusive) to *hi* (exclusive). As with [*array*.slice][1], if either *lo* or *hi* are negative, it indicates an offset from the end of the array; if *lo* is undefined it defaults to 0, and if *hi* is undefined it defaults to Infinity. Note: limiting the imputed domain of one scale, say *x*, does not affect the imputed domain of another scale, say *y*; each scale domain is imputed independently. [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice |
| `opacity` | ChannelDomainValueSpec |  |  |
| `order` | "ascending" \| "descending" \| null |  | How to order reduced values. |
| `r` | ChannelDomainValueSpec |  |  |
| `reduce` | Reducer \| boolean \| null |  | How to produce a singular value (for subsequent sorting) from aggregated channel values; one of: - true (default) - alias for *max* - false or null - disabled; don’t impute the scale domain - a named reducer implementation such as *count* or *sum* - a function that takes an array of values and returns the reduced value - an object that implements the *reduceIndex* method |
| `reverse` | boolean |  | If true, reverse the order after sorting. |
| `symbol` | ChannelDomainValueSpec |  |  |
| `x` | ChannelDomainValueSpec |  |  |
| `y` | ChannelDomainValueSpec |  |  |

## ChannelDomainValue
The available inputs for imputing scale domains. In addition to a named channel, an input may be specified as: - *data* - impute from mark data - *width* - impute from |*x2* - *x1*| - *height* - impute from |*y2* - *y1*| - null - impute from input order If the *x* channel is not defined, the *x2* channel will be used instead if available, and similarly for *y* and *y2*; this is useful for marks that implicitly stack. The *data* input is typically used in conjunction with a custom **reduce** function, as when the built-in single-channel reducers are insufficient.

Type: `ChannelName | "data" | "width" | "height" | "-ariaLabel" | "-fill" | "-fillOpacity" | "-fontSize" | "-fx" | "-fy" | "-geometry" | "-height" | "-href" | "-length" | "-opacity" | "-path" | "-r" | "-rotate" | "-src" | "-stroke" | "-strokeOpacity" | "-strokeWidth" | "-symbol" | "-text" | "-title" | "-weight" | "-width" | "-x" | "-x1" | "-x2" | "-y" | "-y1" | "-y2" | "-z" | "-data" | null`

## ChannelDomainValueSpec
How to derive a scale’s domain from a channel’s values.

Type: `ChannelDomainValue | object`

## ChannelName
The set of known channel names.

Type: `"ariaLabel" | "fill" | "fillOpacity" | "fontSize" | "fx" | "fy" | "geometry" | "height" | "href" | "length" | "opacity" | "path" | "r" | "rotate" | "src" | "stroke" | "strokeOpacity" | "strokeWidth" | "symbol" | "text" | "title" | "weight" | "width" | "x" | "x1" | "x2" | "y" | "y1" | "y2" | "z"`

## ChannelValue
A channel’s values may be expressed as: - a field name, to extract the corresponding value for each datum - an iterable of values, typically of the same length as the data - a channel transform or SQL expression - a constant number or boolean - null to represent no value

Type: `object[] | string | number | boolean | null | Transform | SQLExpression | AggregateExpression`

## ChannelValueIntervalSpec
In some contexts, when specifying a mark channel’s value, you can provide a {value, interval} object to specify an associated interval.

Type: `ChannelValueSpec | object`

## ChannelValueSpec
When specifying a mark channel’s value, you can provide a {value, scale} object to override the scale that would normally be associated with the channel.

Type: `ChannelValue | object`

## ColorScaleType
The supported scale types for *color* encodings. For quantitative data, one of: - *linear* (default) - linear transform (translate and scale) - *pow* - power (exponential) transform - *sqrt* - square-root transform; *pow* with *exponent* = 0.5 - *log* - logarithmic transform - *symlog* - bi-symmetric logarithmic transform per Webber et al. For temporal data, one of: - *utc* (default, recommended) - UTC time - *time* - local time For ordinal data, one of: - *ordinal* - from discrete inputs to discrete outputs For color, one of: - *categorical* - equivalent to *ordinal*; defaults to *observable10* - *sequential* - equivalent to *linear*; defaults to *turbo* - *cyclical* - equivalent to *linear*; defaults to *rainbow* - *threshold* - encodes using discrete thresholds; defaults to *rdylbu* - *quantile* - encodes using quantile thresholds; defaults to *rdylbu* - *quantize* - uniformly quantizes a continuous domain; defaults to *rdylbu* - *diverging* - *linear*, but with a pivot; defaults to *rdbu* - *diverging-log* - *log*, but with a pivot; defaults to *rdbu* - *diverging-pow* - *pow*, but with a pivot; defaults to *rdbu* - *diverging-sqrt* - *sqrt*, but with a pivot; defaults to *rdbu* - *diverging-symlog* - *symlog*, but with a pivot; defaults to *rdbu* Other scale types: - *identity* - do not transform values when encoding

Type: `"linear" | "pow" | "sqrt" | "log" | "symlog" | "utc" | "time" | "point" | "band" | "ordinal" | "sequential" | "cyclical" | "diverging" | "diverging-log" | "diverging-pow" | "diverging-sqrt" | "diverging-symlog" | "categorical" | "threshold" | "quantile" | "quantize" | "identity"`

## ColorScheme
The built-in color schemes. For categorical data, one of: - *Accent* - eight colors - *Category10* - ten colors - *Dark2* - eight colors - *Observable10* (default) - ten colors - *Paired* - twelve paired colors - *Pastel1* - nine colors - *Pastel2* - eight colors - *Set1* - nine colors - *Set2* - eight colors - *Set3* - twelve colors - *Tableau10* - ten colors For diverging data, one of: - *BrBG* - from brown to white to blue-green - *PRGn* - from purple to white to green - *PiYG* - from pink to white to yellow-green - *PuOr* - from purple to white to orange - *RdBu* (default) - from red to white to blue - *RdGy* - from red to white to gray - *RdYlBu* - from red to yellow to blue - *RdYlGn* - from red to yellow to green - *Spectral* - from red to blue, through the spectrum - *BuRd* - from blue to white to red - *BuYlRd* - from blue to yellow to red For sequential data, one of: - *Blues* - from white to blue - *Greens* - from white to green - *Greys* - from white to gray - *Oranges* - from white to orange - *Purples* - from white to purple - *Reds* - from white to red - *Turbo* (default) - from blue to red, through the spectrum - *Viridis* - from blue to green to yellow - *Magma* - from purple to orange to yellow - *Inferno* - from purple to orange to yellow - *Plasma* - from purple to orange to yellow - *Cividis* - from blue to yellow - *Cubehelix* - from black to white, rotating hue - *Warm* - from purple to green, through warm hues - *Cool* - from green to to purple, through cool hues - *BuGn* - from light blue to dark green - *BuPu* - from light blue to dark purple - *GnBu* - from light green to dark blue - *OrRd* - from light orange to dark red - *PuBu* - from light purple to dark blue - *PuBuGn* - from light purple to blue to dark green - *PuRd* - from light purple to dark red - *RdPu* - from light red to dark purple - *YlGn* - from light yellow to dark green - *YlGnBu* - from light yellow to green to dark blue - *YlOrBr* - from light yellow to orange to dark brown - *YlOrRd* - from light yellow to orange to dark red For cyclical data, one of: - *Rainbow* (default) - the less-angry rainbow color scheme - *Sinebow* - Bumgardner and Loyd’s “sinebow” scheme

Type: `"Accent" | "Category10" | "Dark2" | "Observable10" | "Paired" | "Pastel1" | "Pastel2" | "Set1" | "Set2" | "Set3" | "Tableau10" | "BrBG" | "PRGn" | "PiYG" | "PuOr" | "RdBu" | "RdGy" | "RdYlBu" | "RdYlGn" | "Spectral" | "BuRd" | "BuYlRd" | "Blues" | "Greens" | "Greys" | "Oranges" | "Purples" | "Reds" | "Turbo" | "Viridis" | "Magma" | "Inferno" | "Plasma" | "Cividis" | "Cubehelix" | "Warm" | "Cool" | "BuGn" | "BuPu" | "GnBu" | "OrRd" | "PuBu" | "PuBuGn" | "PuRd" | "RdPu" | "YlGn" | "YlGnBu" | "YlOrBr" | "YlOrRd" | "Rainbow" | "Sinebow" | object`

## Column
A column transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `column` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Interpret a string or param-value as a column reference. |

## ColumnTransform
A data transform that maps one column value to another.

Type: `Bin | Column | DateMonth | DateMonthDay | DateDay | Centroid | CentroidX | CentroidY | GeoJSON`

## Component
A specification component such as a plot, input widget, or layout.

Type: `HConcat | VConcat | HSpace | VSpace | Menu | Search | Slider | Table | Plot | PlotMark | Legend`

## ContinuousScaleType
The supported scale types for continuous encoding channels. For quantitative data, one of: - *linear* (default) - linear transform (translate and scale) - *pow* - power (exponential) transform - *sqrt* - square-root transform; *pow* with *exponent* = 0.5 - *log* - logarithmic transform - *symlog* - bi-symmetric logarithmic transform per Webber et al. For temporal data, one of: - *utc* (default, recommended) - UTC time - *time* - local time Other scale types: - *identity* - do not transform values when encoding

Type: `"linear" | "pow" | "sqrt" | "log" | "symlog" | "utc" | "time" | "identity"`

## Count
A count aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `count` | null \| any[] \| string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the count of records in an aggregation group. |
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## CumeDist
A cume_dist window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `cume_dist` | null \| any[] | yes | Compute the cumulative distribution value over an ordered window partition. Equals the number of partition rows preceding or peer with the current row, divided by the total number of partition rows. |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Curve
How to interpolate between control points.

Type: `CurveName`

## CurveName
The built-in curve implementations.

Type: `"basis" | "basis-closed" | "basis-open" | "bundle" | "bump-x" | "bump-y" | "cardinal" | "cardinal-closed" | "cardinal-open" | "catmull-rom" | "catmull-rom-closed" | "catmull-rom-open" | "linear" | "linear-closed" | "monotone-x" | "monotone-y" | "natural" | "step" | "step-after" | "step-before"`

## Data
Top-level dataset definitions.

Type: `object`

## DataArray
An inline array of data objects to treat as JSON data.

Type: `object[]`

## DataCSV
A data definition that loads a csv file.


| Option | Type | Required | Description |
|---|---|---|---|
| `delimiter` | string |  | The column delimiter string. If not specified, DuckDB will try to infer the delimiter automatically. |
| `file` | string | yes | The file path for the dataset to load. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `sample_size` | number |  | The sample size, in table rows, to consult for type inference. Set to `-1` to process all rows in the dataset. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "csv" | yes | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataDefinition

Type: `DataQuery | DataArray | DataFile | DataTable | DataParquet | DataCSV | DataSpatial | DataJSON | DataJSONObjects`

## DataFile
A data definition that loads an external data file.


| Option | Type | Required | Description |
|---|---|---|---|
| `file` | string | yes | The data file to load. If no type option is provided, the file suffix must be one of `.csv`, `.json`, or `.parquet`. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataJSON


| Option | Type | Required | Description |
|---|---|---|---|
| `file` | string | yes | The file path for the dataset to load. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "json" | yes | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataJSONObjects


| Option | Type | Required | Description |
|---|---|---|---|
| `data` | object[] | yes | An array of inline objects in JSON-style format. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "json" |  | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataParquet
A data definition that loads a parquet file.


| Option | Type | Required | Description |
|---|---|---|---|
| `file` | string | yes | The file path for the dataset to load. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "parquet" | yes | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataQuery
A SQL query defining a new temporary database table.

Type: `string`

## DataSpatial
A data definition that loads a supported spatial data file format.


| Option | Type | Required | Description |
|---|---|---|---|
| `file` | string | yes | The file path for the spatial dataset to load. See the [DuckDB spatial documentation][1] for more information on supported file types. [1]: https://duckdb.org/docs/extensions/spatial.html#st_read--read-spatial-data-from-files |
| `layer` | string |  | The named layer to load from the file. For example, in a TopoJSON file the layer is the named object to extract. For Excel spreadsheet files, the layer is the name of the worksheet to extract. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "spatial" | yes | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DataTable
A data definition that queries an existing table.


| Option | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | A SQL query string for the desired table data. |
| `replace` | boolean |  | Flag (default `true`) to replace an existing table of the same name. If `false`, creating a new table with an existing name raises an error. |
| `select` | string[] |  | A list of column names to extract upon load. Any other columns are omitted. |
| `temp` | boolean |  | Flag (default `true`) to generate a temporary view or table. |
| `type` | "table" | yes | The data source type. One of: - `"table"`: Define a new table based on a SQL query. - `"csv"`: Load a comma-separated values (CSV) file. - `"json"`: Load JavaScript Object Notation (json) data. - `"parquet"`: Load a Parquet file. - `"spatial"`: Load a spatial data file format via `ST_Read`. |
| `view` | boolean |  | Flag (default `false`) to generate a view instead of a table. |
| `where` | string \| string[] |  | A filter (WHERE clause) to apply upon load. Only rows that pass the filter are included. |

## DateDay
A dateDay transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `dateDay` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Transform a Date value to a day of the month for cyclic comparison. Year and month values are collapsed to enable comparison over days only. |

## DateMonth
A dateMonth transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `dateMonth` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Transform a Date value to a month boundary for cyclic comparison. Year values are collapsed to enable comparison over months only. |

## DateMonthDay
A dateMonthDay transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `dateMonthDay` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Transform a Date value to a month and day boundary for cyclic comparison. Year values are collapsed to enable comparison over months and days only. |

## Days
A date/time interval in units of days.


| Option | Type | Required | Description |
|---|---|---|---|
| `days` | number | yes | A date/time interval in units of days. |

## DenseRank
A dense_rank window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `dense_rank` | null \| any[] | yes | Compute the dense row rank (no gaps) over an ordered window partition. Sorting ties do not result in gaps in the rank numbers ([1, 1, 2, ...]). |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## DiscreteScaleType
The supported scale types for discrete encoding channels. One of: - *ordinal* - from discrete inputs to discrete outputs - *identity* - do not transform values when encoding

Type: `"ordinal" | "identity"`

## First
A first aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `first` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Return the first column value found in an aggregation group. |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## FirstValue
A first_value window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `first_value` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Get the first value of the given column in the current window frame. |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Fixed
A symbol indicating a fixed scale domain. A fixed domain is initially determined from data as usual, but subsequently "fixed" so that it does not change over subsequent interactive filtering, ensring stable comparisons.

Type: `"Fixed"`

## FrameAnchor
How to anchor a mark relative to the plot’s frame; one of: - *middle* - centered in the middle - in the middle of one of the edges: *top*, *right*, *bottom*, *left* - in one of the corners: *top-left*, *top-right*, *bottom-right*, *bottom-left*

Type: `"middle" | "top-left" | "top" | "top-right" | "right" | "bottom-right" | "bottom" | "bottom-left" | "left"`

## FrameValue

Type: `number | IntervalTransform | null`

## GeoJSON
A geojson transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `geojson` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute a GeoJSON-formatted string from geometry-typed data. This transform requires the DuckDB `spatial` extension. |

## GridInterpolate
A spatial interpolation method; one of: - *none* - do not perform interpolation (the default), maps samples to single bins - *linear* - apply proportional linear interpolation across adjacent bins - *nearest* - assign each pixel to the closest sample’s value (Voronoi diagram) - *barycentric* - apply barycentric interpolation over the Delaunay triangulation - *random-walk* - apply a random walk from each pixel, stopping when near a sample

Type: `"none" | "linear" | "nearest" | "barycentric" | "random-walk"`

## HConcat
An hconcat component.


| Option | Type | Required | Description |
|---|---|---|---|
| `hconcat` | Component[] | yes | Horizontally concatenate components in a row layout. |

## HSpace
An hspace component.


| Option | Type | Required | Description |
|---|---|---|---|
| `hspace` | number \| string | yes | Horizontal space to place between components. Number values indicate screen pixels. String values may use CSS units (em, pt, px, etc). |

## Highlight
A highlight interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `by` | ParamRef | yes | The input selection. Unselected marks are deemphasized. |
| `fill` | string |  | The fill color of deemphasized marks. By default the fill is unchanged. |
| `fillOpacity` | number |  | The fill opacity of deemphasized marks. By default the fill opacity is unchanged. |
| `opacity` | number |  | The overall opacity of deemphasized marks. By default the opacity is set to 0.2. |
| `select` | "highlight" | yes | Highlight selected marks by deemphasizing the others. |
| `stroke` | string |  | The stroke color of deemphasized marks. By default the stroke is unchanged. |
| `strokeOpacity` | number |  | The stroke opacity of deemphasized marks. By default the stroke opacity is unchanged. |

## Hours
A date/time interval in units of hours.


| Option | Type | Required | Description |
|---|---|---|---|
| `hours` | number | yes | A date/time interval in units of hours. |

## Interpolate
How to interpolate range (output) values for continuous scales; one of: - *number* - linear numeric interpolation - *rgb* - red, green, blue (sRGB) - *hsl* - hue, saturation, lightness (HSL; cylindrical sRGB) - *hcl* - hue, chroma, perceptual lightness (CIELCh_ab; cylindrical CIELAB) - *lab* - perceptual lightness and opponent colors (L\*a\*b\*, CIELAB)

Type: `"number" | "rgb" | "hsl" | "hcl" | "lab"`

## Interval
How to partition a continuous range into discrete intervals; one of: - a named time interval such as *day* (for date intervals) - a number (for number intervals), defining intervals at integer multiples of *n*

Type: `LiteralTimeInterval`

## IntervalTransform
Date/time interval.

Type: `Years | Months | Days | Hours | Minutes | Seconds | Milliseconds | Microseconds`

## IntervalX
An intervalX interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `field BETWEEN lo AND hi` is added for the currently selected interval [lo, hi]. |
| `brush` | BrushStyles |  | CSS styles for the brush (SVG `rect`) element. |
| `field` | string |  | The name of the field (database column) over which the interval selection should be defined. If unspecified, the channel field of the first valid prior mark definition is used. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `pixelSize` | number |  | The size of an interactive pixel (default `1`). Larger pixel sizes reduce the brush resolution, which can reduce the size of pre-aggregated materialized views. |
| `select` | "intervalX" | yes | Select a continuous 1D interval selection over the `x` scale domain. |

## IntervalXY
An intervalXY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(xfield BETWEEN x1 AND x2) AND (yfield BETWEEN y1 AND y2)` is added for the currently selected intervals. |
| `brush` | BrushStyles |  | CSS styles for the brush (SVG `rect`) element. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `pixelSize` | number |  | The size of an interactive pixel (default `1`). Larger pixel sizes reduce the brush resolution, which can reduce the size of pre-aggregated materialized views. |
| `select` | "intervalXY" | yes | Select a continuous 2D interval selection over the `x` and `y` scale domains. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the interval selection should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the interval selection should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## IntervalY
An intervalY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `field BETWEEN lo AND hi` is added for the currently selected interval [lo, hi]. |
| `brush` | BrushStyles |  | CSS styles for the brush (SVG `rect`) element. |
| `field` | string |  | The name of the field (database column) over which the interval selection should be defined. If unspecified, the channel field of the first valid prior mark definition is used. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `pixelSize` | number |  | The size of an interactive pixel (default `1`). Larger pixel sizes reduce the brush resolution, which can reduce the size of pre-aggregated materialized views. |
| `select` | "intervalY" | yes | Select a continuous 1D interval selection over the `y` scale domain. |

## LabelArrow

Type: `"auto" | "up" | "right" | "down" | "left" | "none" | true | false | null`

## Lag
A lag window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `lag` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute lagging values in a column. Returns the value at the row that is `offset` (second argument, default `1`) rows before the current row within the window frame. If there is no such row, instead return `default` (third argument, default `null`). Both offset and default are evaluated with respect to the current row. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Last
A last aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `last` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Return the last column value found in an aggregation group. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## LastValue
A last_value window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `last_value` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Get the last value of the given column in the current window frame. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Lead
A lead window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `lag` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute leading values in a column. Returns the value at the row that is `offset` (second argument, default `1`) rows after the current row within the window frame. If there is no such row, instead return `default` (third argument, default `null`). Both offset and default are evaluated with respect to the current row. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Legend
A legend defined as a top-level spec component.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef |  | The output selection. If specified, the legend is interactive, using a `toggle` interaction for discrete legends or an `intervalX` interaction for continuous legends. |
| `columns` | number |  | The number of columns to use to layout a discrete legend. |
| `field` | string |  | The data field over which to generate output selection clauses. If unspecified, a matching field is retrieved from existing plot marks. |
| `for` | string | yes | The name of the plot this legend applies to. A plot must include a `name` attribute to be referenced. |
| `height` | number |  | The height of a continuous legend, in pixels. |
| `label` | string |  | The legend label. |
| `legend` | "color" \| "opacity" \| "symbol" | yes | A legend of the given type. The valid types are `"color"`, `"opacity"`, and `"symbol"`. |
| `marginBottom` | number |  | The bottom margin of the legend component, in pixels. |
| `marginLeft` | number |  | The left margin of the legend component, in pixels. |
| `marginRight` | number |  | The right margin of the legend component, in pixels. |
| `marginTop` | number |  | The top margin of the legend component, in pixels. |
| `tickSize` | number |  | The size of legend ticks in a continuous legend, in pixels. |
| `width` | number |  | The width of a continuous legend, in pixels. |

## LiteralTimeInterval

Type: `"3 months" | "10 years" | TimeIntervalName | "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "quarters" | "halfs" | "years" | "mondays" | "tuesdays" | "wednesdays" | "thursdays" | "fridays" | "saturdays" | "sundays" | string`

## MarkerName
The built-in marker implementations; one of: - *arrow* - an arrowhead with *auto* orientation - *arrow-reverse* - an arrowhead with *auto-start-reverse* orientation - *dot* - a filled *circle* with no stroke and 2.5px radius - *circle-fill* - a filled circle with a white stroke and 3px radius - *circle-stroke* - a stroked circle with a white fill and 3px radius - *circle* - alias for *circle-fill* - *tick* - a small opposing line - *tick-x* - a small horizontal line - *tick-y* - a small vertical line

Type: `"arrow" | "arrow-reverse" | "dot" | "circle" | "circle-fill" | "circle-stroke" | "tick" | "tick-x" | "tick-y"`

## Max
A max aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `max` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the maximum value of the given column. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Median
A median aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `median` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the median value of the given column. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Menu
A menu input component.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef |  | The output selection. A selection clause is added for the currently selected menu option. |
| `column` | string |  | The name of a database column from which to pull menu options. The unique column values are used as menu options. Used in conjunction with the `from` property. |
| `field` | string |  | The database column name to use within generated selection clause predicates. Defaults to the `column` property. |
| `filterBy` | ParamRef |  | A selection to filter the database table indicated by the `from` property. |
| `from` | string |  | The name of a database table to use as a data source for this widget. Used in conjunction with the `column` property. |
| `input` | "menu" | yes | A menu input widget. |
| `label` | string |  | A text label for this input. |
| `listMatch` | "any" \| "all" |  | Required if the database column is an list, this property determines how to match the selected menu option against the list values. |
| `options` | object[] |  | An array of menu options, as literal values or option objects. Option objects have a `value` property and an optional `label` property. If no label is provided, the string-coerced value is used. |
| `value` | object |  | The initial selected menu value. |

## Microseconds
A date/time interval in units of microseconds.


| Option | Type | Required | Description |
|---|---|---|---|
| `microseconds` | number | yes | A date/time interval in units of microseconds. |

## Milliseconds
A date/time interval in units of milliseconds.


| Option | Type | Required | Description |
|---|---|---|---|
| `milliseconds` | number | yes | A date/time interval in units of milliseconds. |

## Min
A min aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `min` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the minimum value of the given column. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Minutes
A date/time interval in units of minutes.


| Option | Type | Required | Description |
|---|---|---|---|
| `minutes` | number | yes | A date/time interval in units of minutes. |

## Mode
A mode aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `mode` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the mode value of the given column. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Months
A date/time interval in units of months.


| Option | Type | Required | Description |
|---|---|---|---|
| `months` | number | yes | A date/time interval in units of months. |

## NTile
An ntile window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `ntile` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute an n-tile integer ranging from 1 to the provided argument (num_buckets), dividing the partition as equally as possible. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## NearestX
A nearestX interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `field = value` is added for the currently nearest value. |
| `channels` | string[] |  | The encoding channels whose domain values should be selected. For example, a setting of `['color']` selects the data value backing the color channel, whereas `['x', 'z']` selects both x and z channel domain values. If unspecified, the selected channels default to match the current pointer settings: a `nearestX` interactor selects the `['x']` channels, while a `nearest` interactor selects the `['x', 'y']` channels. |
| `fields` | string[] |  | The fields (database column names) to use in generated selection clause predicates. If unspecified, the fields backing the selected *channels* in the first valid prior mark definition are used by default. |
| `maxRadius` | number |  | The maximum radius of a nearest selection (default 40). Marks with (x, y) coordinates outside this radius will not be selected as nearest points. |
| `select` | "nearestX" | yes | Select values from the mark closest to the pointer *x* location. |

## NearestY
A nearestY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `field = value` is added for the currently nearest value. |
| `channels` | string[] |  | The encoding channels whose domain values should be selected. For example, a setting of `['color']` selects the data value backing the color channel, whereas `['x', 'z']` selects both x and z channel domain values. If unspecified, the selected channels default to match the current pointer settings: a `nearestX` interactor selects the `['x']` channels, while a `nearest` interactor selects the `['x', 'y']` channels. |
| `fields` | string[] |  | The fields (database column names) to use in generated selection clause predicates. If unspecified, the fields backing the selected *channels* in the first valid prior mark definition are used by default. |
| `maxRadius` | number |  | The maximum radius of a nearest selection (default 40). Marks with (x, y) coordinates outside this radius will not be selected as nearest points. |
| `select` | "nearestY" | yes | Select values from the mark closest to the pointer *y* location. |

## NthValue
An nth_value window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `nth_value` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Get the nth value of the given column in the current window frame, counting from one. The second argument is the offset for the nth row. |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Pan
A pan interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "pan" | yes | Pan a plot along both the `x` and `y` scales. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## PanX
A panX interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "panX" | yes | Pan a plot along the `x` scale only. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## PanY
A panY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "panY" | yes | Pan a plot along the `y` scale only. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## PanZoom
A panZoom interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "panZoom" | yes | Pan and zoom a plot along both the `x` and `y` scales. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## PanZoomX
A panZoomX interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "panZoomX" | yes | Pan and zoom a plot along the `x` scale only. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## PanZoomY
A panZoomY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "panZoomY" | yes | Pan and zoom a plot along the `y` scale only. |
| `x` | ParamRef |  | The output selection for the `x` domain. A clause of the form `field BETWEEN x1 AND x2` is added for the current pan/zom interval [x1, x2]. |
| `xfield` | string |  | The name of the field (database column) over which the `x`-component of the pan/zoom interval should be defined. If unspecified, the `x` channel field of the first valid prior mark definition is used. |
| `y` | ParamRef |  | The output selection for the `y` domain. A clause of the form `field BETWEEN y1 AND y2` is added for the current pan/zom interval [y1, y2]. |
| `yfield` | string |  | The name of the field (database column) over which the `y`-component of the pan/zoom interval should be defined. If unspecified, the `y` channel field of the first valid prior mark definition is used. |

## Param
A Param definition.


| Option | Type | Required | Description |
|---|---|---|---|
| `select` | "value" |  | The type of reactive parameter. One of: - `"value"` (default) for a standard `Param` - `"intersect"` for a `Selection` that intersects clauses (logical "and") - `"union"` for a `Selection` that unions clauses (logical "or") - `"single"` for a `Selection` that retains a single clause only - `"crossfilter"` for a cross-filtered intersection `Selection` |
| `value` | ParamValue | yes | The initial parameter value. |

## ParamDate
A Date-valued Param definition.


| Option | Type | Required | Description |
|---|---|---|---|
| `date` | string | yes | The initial parameter value as an ISO date/time string to be parsed to a Date object. |
| `select` | "value" |  | The type of reactive parameter. One of: - `"value"` (default) for a standard `Param` - `"intersect"` for a `Selection` that intersects clauses (logical "and") - `"union"` for a `Selection` that unions clauses (logical "or") - `"single"` for a `Selection` that retains a single clause only - `"crossfilter"` for a cross-filtered intersection `Selection` |

## ParamDefinition
A Param or Selection definition.

Type: `ParamValue | Param | ParamDate | Selection`

## ParamLiteral
Literal Param values.

Type: `null | string | number | boolean`

## ParamRef

Type: `string`

## ParamValue
Valid Param values.

Type: `ParamLiteral | ParamLiteral | ParamRef[]`

## Params
Top-level Param and Selection definitions.

Type: `object`

## PercentRank
A percent_rank window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `percent_rank` | null \| any[] | yes | Compute the percentage rank over an ordered window partition. |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Plot
A plot component.


| Option | Type | Required | Description |
|---|---|---|---|
| `align` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `ariaDescription` | string \| null |  | The [aria-description attribute][1] on the SVG root. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description |
| `ariaLabel` | string \| null |  | The [aria-label attribute][1] on the SVG root. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label |
| `aspectRatio` | number \| boolean \| null \| ParamRef |  | The desired aspect ratio of the *x* and *y* scales, affecting the default height. Given an aspect ratio of *dx* / *dy*, and assuming that the *x* and *y* scales represent equivalent units (say, degrees Celsius or meters), computes a default height such that *dx* pixels along *x* represents the same variation as *dy* pixels along *y*. Note: when faceting, set the *fx* and *fy* scales’ **round** option to false for an exact aspect ratio. |
| `axis` | "top" \| "right" \| "bottom" \| "left" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *x* or *fx*, or *left* or *right* for *y* or *fy*. The default depends on the scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x* or *fx*, or *left* and *right* for *y* or *fy*). If null, the implicit axis is suppressed. For position axes only. |
| `clip` | "frame" \| "sphere" \| boolean \| null \| ParamRef |  | The default clip for all marks. |
| `colorBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* and *diverging-log* scales only. |
| `colorClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `colorConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* and *diverging-symlog* scales only. |
| `colorDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `colorExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* and *diverging-pow* scales only. |
| `colorInterpolate` | Interpolate \| ParamRef |  | How to interpolate color range values. For quantitative scales only. This attribute can be used to specify a color space for interpolating colors specified in the **colorRange**. |
| `colorLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `colorN` | number \| ParamRef |  | For a *quantile* scale, the number of quantiles (creates *n* - 1 thresholds); for a *quantize* scale, the approximate number of thresholds; defaults to 5. |
| `colorNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `colorPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `colorPivot` | object \| ParamRef |  | For a diverging color scale, the input value (abstract value) that divides the domain into two parts; defaults to 0 for *diverging* scales, dividing the domain into negative and positive parts; defaults to 1 for *diverging-log* scales. By default, diverging scales are symmetric around the pivot; see the **symmetric** option. |
| `colorRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**. For other ordinal data, it is an array (or iterable) of output values in the same order as the **domain**. |
| `colorReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `colorScale` | ColorScaleType \| null \| ParamRef |  | The *color* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*. |
| `colorScheme` | ColorScheme \| ParamRef |  | If specified, shorthand for setting the **colorRange** or **colorInterpolate** option of a *color* scale. |
| `colorSymmetric` | boolean \| ParamRef |  | For a diverging color scale, if true (the default), extend the domain to ensure that the lower part of the domain (below the **pivot**) is commensurate with the upper part of the domain (above the **pivot**). A symmetric diverging color scale may not use all of its output **range**; this reduces contrast but ensures that deviations both below and above the **pivot** are represented proportionally. Otherwise if false, the full output **range** will be used; this increases contrast but values on opposite sides of the **pivot** may not be meaningfully compared. |
| `colorTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `colorZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `facetGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Default axis grid for fx and fy scales; typically set to true to enable. |
| `facetLabel` | string \| null \| ParamRef |  | Default axis label for fx and fy scales; typically set to null to disable. |
| `facetMargin` | number \| ParamRef |  | Shorthand to set the same default for all four facet margins: marginTop, marginRight, marginBottom, and marginLeft. |
| `facetMarginBottom` | number \| ParamRef |  | The right facet margin; the (minimum) distance in pixels between the right edges of the inner and outer plot area. |
| `facetMarginLeft` | number \| ParamRef |  | The bottom facet margin; the (minimum) distance in pixels between the bottom edges of the inner and outer plot area. |
| `facetMarginRight` | number \| ParamRef |  | The left facet margin; the (minimum) distance in pixels between the left edges of the inner and outer plot area. |
| `facetMarginTop` | number \| ParamRef |  | The top facet margin; the (minimum) distance in pixels between the top edges of the inner and outer plot area. |
| `fxAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `fxAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `fxAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `fxAxis` | "top" \| "bottom" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *fx*. Defaults to *top* if there is a *bottom* *x* axis, and otherwise *bottom*. If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *fx*). If null, the implicit axis is suppressed. |
| `fxDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `fxFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `fxGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `fxInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `fxInsetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `fxInsetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `fxLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `fxLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `fxLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `fxLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `fxPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `fxPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `fxPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `fxRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `fxReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `fxRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `fxTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `fxTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fxTickSize** and **fxTickRotate**. |
| `fxTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `fxTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `fxTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `fxTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `fyAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `fyAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `fyAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `fyAxis` | "left" \| "right" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *left* or *right* for *fy*. Defaults to *left* for an *fy* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *fy*). If null, the implicit axis is suppressed. |
| `fyDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `fyFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `fyGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `fyInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `fyInsetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `fyInsetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `fyLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `fyLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `fyLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `fyLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `fyPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `fyPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `fyPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `fyRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `fyReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `fyRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `fyTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `fyTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fyTickSize** and **fyTickRotate**. |
| `fyTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `fyTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `fyTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `fyTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `grid` | boolean \| string \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `height` | number \| ParamRef |  | The outer height of the plot in pixels, including margins. The default depends on the plot’s scales, and the plot’s width if an aspectRatio is specified. For example, if the *y* scale is linear and there is no *fy* scale, it might be 396. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `lengthBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `lengthClamp` | object |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `lengthConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `lengthDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `lengthExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `lengthNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `lengthPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `lengthRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Length scales have a default range of [0, 12]. |
| `lengthScale` | ContinuousScaleType \| null \| ParamRef |  | The *length* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The length scale defaults to *linear*, as this scale is intended for quantitative data. |
| `lengthZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `margin` | number \| ParamRef |  | Shorthand to set the same default for all four margins: **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**. Otherwise, the default margins depend on the maximum margins of the plot’s marks. While most marks default to zero margins (because they are drawn inside the chart area), Plot’s axis marks have non-zero default margins. |
| `marginBottom` | number \| ParamRef |  | The bottom margin; the distance in pixels between the bottom edges of the inner and outer plot area. Defaults to the maximum bottom margin of the plot’s marks. |
| `marginLeft` | number \| ParamRef |  | The left margin; the distance in pixels between the left edges of the inner and outer plot area. Defaults to the maximum left margin of the plot’s marks. |
| `marginRight` | number \| ParamRef |  | The right margin; the distance in pixels between the right edges of the inner and outer plot area. Defaults to the maximum right margin of the plot’s marks. |
| `marginTop` | number \| ParamRef |  | The top margin; the distance in pixels between the top edges of the inner and outer plot area. Defaults to the maximum top margin of the plot’s marks. |
| `margins` | object |  | A shorthand object notation for setting multiple margin values. The object keys are margin names (top, right, etc). |
| `name` | string |  | A unique name for the plot. The name is used by standalone legend components to to lookup the plot and access scale mappings. |
| `opacityBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `opacityClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `opacityConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `opacityDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `opacityExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `opacityLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `opacityNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `opacityPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `opacityRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). Opacity scales have a default range of [0, 1]. |
| `opacityReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `opacityScale` | ContinuousScaleType \| null \| ParamRef |  | The *opacity* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The opacity scale defaults to *linear*; this scales is intended for quantitative data. |
| `opacityTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `opacityZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `padding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `plot` | PlotMark \| PlotInteractor \| PlotLegend[] | yes | An array of plot marks, interactors, or legends. Marks are graphical elements that make up plot layers. Unless otherwise configured, interactors will use the nearest previous mark as a basis for which data fields to select. |
| `projectionClip` | boolean \| number \| "frame" \| null \| ParamRef |  | The projection’s clipping method; one of: - *frame* or true (default) - clip to the plot’s frame (including margins but not insets) - a number - clip to a circle of the given radius in degrees centered around the origin - null or false - do not clip Some projections (such as [*armadillo*][1] and [*berghaus*][2]) require spherical clipping: in that case set the marks’ **clip** option to *sphere*. [1]: https://observablehq.com/@d3/armadillo [2]: https://observablehq.com/@d3/berghaus-star |
| `projectionDomain` | object \| ParamRef |  | A GeoJSON object to fit to the plot’s frame (minus insets); defaults to a Sphere for spherical projections (outline of the the whole globe). |
| `projectionInset` | number \| ParamRef |  | Shorthand to set the same default for all four projection insets. All insets typically default to zero, though not always. A positive inset reduces effective area, while a negative inset increases it. |
| `projectionInsetBottom` | number \| ParamRef |  | Insets the bottom edge of the projection by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `projectionInsetLeft` | number \| ParamRef |  | Insets the left edge of the projection by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `projectionInsetRight` | number \| ParamRef |  | Insets the right edge of the projection by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `projectionInsetTop` | number \| ParamRef |  | Insets the top edge of the projection by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `projectionParallels` | object[] \| ParamRef |  | The [standard parallels][1]. For conic projections only. [1]: https://d3js.org/d3-geo/conic#conic_parallels |
| `projectionPrecision` | number \| ParamRef |  | The projection’s [sampling threshold][1]. [1]: https://d3js.org/d3-geo/projection#projection_precision |
| `projectionRotate` | object[] \| ParamRef |  | A rotation of the sphere before projection; defaults to [0, 0, 0]. Specified as Euler angles λ (yaw, or reference longitude), φ (pitch, or reference latitude), and optionally γ (roll), in degrees. |
| `projectionType` | ProjectionName \| null \| ParamRef |  | The desired projection; one of: - a named built-in projection such as *albers-usa* - null, for no projection Named projections are scaled and translated to fit the **domain** to the plot’s frame (minus insets). |
| `rBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `rClamp` | object |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `rConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `rDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Radius scales have a default domain from 0 to the median first quartile of associated channels. |
| `rExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `rLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. |
| `rNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `rPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `rRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Radius scales have a default range of [0, 3]. |
| `rScale` | ContinuousScaleType \| null \| ParamRef |  | The *r* (radius) scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The radius scale defaults to *sqrt*; this scale is intended for quantitative data. |
| `rZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `style` | string \| CSSStyles \| null \| ParamRef |  | Custom styles to override Plot’s defaults. Styles may be specified either as a string of inline styles (*e.g.*, `"color: red;"`, in the same fashion as assigning [*element*.style][1]) or an object of properties (*e.g.*, `{color: "red"}`, in the same fashion as assigning [*element*.style properties][2]). Note that unitless numbers ([quirky lengths][3]) such as `{padding: 20}` may not supported by some browsers; you should instead specify a string with units such as `{padding: "20px"}`. By default, the returned plot has a max-width of 100%, and the system-ui font. Plot’s marks and axes default to [currentColor][4], meaning that they will inherit the surrounding content’s color. [1]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style [2]: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration [3]: https://www.w3.org/TR/css-values-4/#deprecated-quirky-length [4]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword |
| `symbolDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. As symbol scales are discrete, the domain is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `symbolRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Symbol scales have a default range of categorical symbols; the choice of symbols depends on whether the associated dot mark is filled or stroked. |
| `symbolScale` | DiscreteScaleType \| null \| ParamRef |  | The *symbol* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. Defaults to an *ordinal* scale type. |
| `width` | number \| ParamRef |  | The outer width of the plot in pixels, including margins. Defaults to 640. On Observable, this can be set to the built-in [width][1] for full-width responsive plots. Note: the default style has a max-width of 100%; the plot will automatically shrink to fit even when a fixed width is specified. [1]: https://github.com/observablehq/stdlib/blob/main/README.md#width |
| `xAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `xAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `xAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `xAxis` | "top" \| "bottom" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *x*. Defaults to *bottom* for an *x* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x*). If null, the implicit axis is suppressed. |
| `xBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `xClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `xConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `xDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `xExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `xFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `xGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `xInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `xInsetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `xInsetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `xLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `xLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `xLabelArrow` | LabelArrow \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `xLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `xLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `xNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `xPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `xPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `xPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `xPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `xRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `xReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `xRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `xScale` | PositionScaleType \| null \| ParamRef |  | The *x* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*. However, the radius scale defaults to *sqrt*, and the length and opacity scales default to *linear*; these scales are intended for quantitative data. The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale. |
| `xTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `xTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `xTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `xTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `xTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `xTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `xZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `xyDomain` | object[] \| Fixed \| ParamRef |  | Set the *x* and *y* scale domains. |
| `yAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `yAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `yAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `yAxis` | "left" \| "right" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *left* or *right* for *y*. Defaults to *left* for a *y* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *y*). If null, the implicit axis is suppressed. |
| `yBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `yClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `yConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `yDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. |
| `yExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `yFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `yGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `yInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `yInsetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `yInsetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `yLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `yLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `yLabelArrow` | LabelArrow \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `yLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `yLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `yNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `yPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `yPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `yPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `yPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `yRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `yReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. Note that by default, when the *y* scale is continuous, the *max* value points to the top of the screen, whereas ordinal values are ranked from top to bottom. |
| `yRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `yScale` | PositionScaleType \| null \| ParamRef |  | The *y* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale. |
| `yTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `yTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **yTickSize** and **yTickRotate**. |
| `yTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `yTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `yTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `yTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `yZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |

## PlotAttributes
Plot attributes.


| Option | Type | Required | Description |
|---|---|---|---|
| `align` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `ariaDescription` | string \| null |  | The [aria-description attribute][1] on the SVG root. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description |
| `ariaLabel` | string \| null |  | The [aria-label attribute][1] on the SVG root. [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label |
| `aspectRatio` | number \| boolean \| null \| ParamRef |  | The desired aspect ratio of the *x* and *y* scales, affecting the default height. Given an aspect ratio of *dx* / *dy*, and assuming that the *x* and *y* scales represent equivalent units (say, degrees Celsius or meters), computes a default height such that *dx* pixels along *x* represents the same variation as *dy* pixels along *y*. Note: when faceting, set the *fx* and *fy* scales’ **round** option to false for an exact aspect ratio. |
| `axis` | "top" \| "right" \| "bottom" \| "left" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *x* or *fx*, or *left* or *right* for *y* or *fy*. The default depends on the scale: - *x* - *bottom* - *y* - *left* - *fx* - *top* if there is a *bottom* *x* axis, and otherwise *bottom* - *fy* - *right* if there is a *left* *y* axis, and otherwise *right* If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x* or *fx*, or *left* and *right* for *y* or *fy*). If null, the implicit axis is suppressed. For position axes only. |
| `clip` | "frame" \| "sphere" \| boolean \| null \| ParamRef |  | The default clip for all marks. |
| `colorBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* and *diverging-log* scales only. |
| `colorClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `colorConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* and *diverging-symlog* scales only. |
| `colorDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `colorExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* and *diverging-pow* scales only. |
| `colorInterpolate` | Interpolate \| ParamRef |  | How to interpolate color range values. For quantitative scales only. This attribute can be used to specify a color space for interpolating colors specified in the **colorRange**. |
| `colorLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `colorN` | number \| ParamRef |  | For a *quantile* scale, the number of quantiles (creates *n* - 1 thresholds); for a *quantize* scale, the approximate number of thresholds; defaults to 5. |
| `colorNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `colorPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `colorPivot` | object \| ParamRef |  | For a diverging color scale, the input value (abstract value) that divides the domain into two parts; defaults to 0 for *diverging* scales, dividing the domain into negative and positive parts; defaults to 1 for *diverging-log* scales. By default, diverging scales are symmetric around the pivot; see the **symmetric** option. |
| `colorRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**. For other ordinal data, it is an array (or iterable) of output values in the same order as the **domain**. |
| `colorReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `colorScale` | ColorScaleType \| null \| ParamRef |  | The *color* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*. |
| `colorScheme` | ColorScheme \| ParamRef |  | If specified, shorthand for setting the **colorRange** or **colorInterpolate** option of a *color* scale. |
| `colorSymmetric` | boolean \| ParamRef |  | For a diverging color scale, if true (the default), extend the domain to ensure that the lower part of the domain (below the **pivot**) is commensurate with the upper part of the domain (above the **pivot**). A symmetric diverging color scale may not use all of its output **range**; this reduces contrast but ensures that deviations both below and above the **pivot** are represented proportionally. Otherwise if false, the full output **range** will be used; this increases contrast but values on opposite sides of the **pivot** may not be meaningfully compared. |
| `colorTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `colorZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `facetGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Default axis grid for fx and fy scales; typically set to true to enable. |
| `facetLabel` | string \| null \| ParamRef |  | Default axis label for fx and fy scales; typically set to null to disable. |
| `facetMargin` | number \| ParamRef |  | Shorthand to set the same default for all four facet margins: marginTop, marginRight, marginBottom, and marginLeft. |
| `facetMarginBottom` | number \| ParamRef |  | The right facet margin; the (minimum) distance in pixels between the right edges of the inner and outer plot area. |
| `facetMarginLeft` | number \| ParamRef |  | The bottom facet margin; the (minimum) distance in pixels between the bottom edges of the inner and outer plot area. |
| `facetMarginRight` | number \| ParamRef |  | The left facet margin; the (minimum) distance in pixels between the left edges of the inner and outer plot area. |
| `facetMarginTop` | number \| ParamRef |  | The top facet margin; the (minimum) distance in pixels between the top edges of the inner and outer plot area. |
| `fxAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `fxAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `fxAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `fxAxis` | "top" \| "bottom" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *fx*. Defaults to *top* if there is a *bottom* *x* axis, and otherwise *bottom*. If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *fx*). If null, the implicit axis is suppressed. |
| `fxDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `fxFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `fxGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `fxInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `fxInsetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `fxInsetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `fxLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `fxLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `fxLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `fxLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `fxPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `fxPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `fxPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `fxRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `fxReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `fxRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `fxTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `fxTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fxTickSize** and **fxTickRotate**. |
| `fxTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `fxTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `fxTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `fxTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `fyAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `fyAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `fyAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `fyAxis` | "left" \| "right" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *left* or *right* for *fy*. Defaults to *left* for an *fy* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *fy*). If null, the implicit axis is suppressed. |
| `fyDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `fyFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `fyGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `fyInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `fyInsetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `fyInsetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `fyLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `fyLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `fyLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `fyLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `fyPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `fyPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `fyPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `fyRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and the plot’s dimensions. For ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `fyReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `fyRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `fyTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `fyTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fyTickSize** and **fyTickRotate**. |
| `fyTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `fyTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `fyTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `fyTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `grid` | boolean \| string \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `height` | number \| ParamRef |  | The outer height of the plot in pixels, including margins. The default depends on the plot’s scales, and the plot’s width if an aspectRatio is specified. For example, if the *y* scale is linear and there is no *fy* scale, it might be 396. |
| `inset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `lengthBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `lengthClamp` | object |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `lengthConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `lengthDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `lengthExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `lengthNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `lengthPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `lengthRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Length scales have a default range of [0, 12]. |
| `lengthScale` | ContinuousScaleType \| null \| ParamRef |  | The *length* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The length scale defaults to *linear*, as this scale is intended for quantitative data. |
| `lengthZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `margin` | number \| ParamRef |  | Shorthand to set the same default for all four margins: **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**. Otherwise, the default margins depend on the maximum margins of the plot’s marks. While most marks default to zero margins (because they are drawn inside the chart area), Plot’s axis marks have non-zero default margins. |
| `marginBottom` | number \| ParamRef |  | The bottom margin; the distance in pixels between the bottom edges of the inner and outer plot area. Defaults to the maximum bottom margin of the plot’s marks. |
| `marginLeft` | number \| ParamRef |  | The left margin; the distance in pixels between the left edges of the inner and outer plot area. Defaults to the maximum left margin of the plot’s marks. |
| `marginRight` | number \| ParamRef |  | The right margin; the distance in pixels between the right edges of the inner and outer plot area. Defaults to the maximum right margin of the plot’s marks. |
| `marginTop` | number \| ParamRef |  | The top margin; the distance in pixels between the top edges of the inner and outer plot area. Defaults to the maximum top margin of the plot’s marks. |
| `margins` | object |  | A shorthand object notation for setting multiple margin values. The object keys are margin names (top, right, etc). |
| `name` | string |  | A unique name for the plot. The name is used by standalone legend components to to lookup the plot and access scale mappings. |
| `opacityBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `opacityClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `opacityConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `opacityDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `opacityExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `opacityLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `opacityNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `opacityPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `opacityRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). Opacity scales have a default range of [0, 1]. |
| `opacityReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `opacityScale` | ContinuousScaleType \| null \| ParamRef |  | The *opacity* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The opacity scale defaults to *linear*; this scales is intended for quantitative data. |
| `opacityTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `opacityZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `padding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `projectionClip` | boolean \| number \| "frame" \| null \| ParamRef |  | The projection’s clipping method; one of: - *frame* or true (default) - clip to the plot’s frame (including margins but not insets) - a number - clip to a circle of the given radius in degrees centered around the origin - null or false - do not clip Some projections (such as [*armadillo*][1] and [*berghaus*][2]) require spherical clipping: in that case set the marks’ **clip** option to *sphere*. [1]: https://observablehq.com/@d3/armadillo [2]: https://observablehq.com/@d3/berghaus-star |
| `projectionDomain` | object \| ParamRef |  | A GeoJSON object to fit to the plot’s frame (minus insets); defaults to a Sphere for spherical projections (outline of the the whole globe). |
| `projectionInset` | number \| ParamRef |  | Shorthand to set the same default for all four projection insets. All insets typically default to zero, though not always. A positive inset reduces effective area, while a negative inset increases it. |
| `projectionInsetBottom` | number \| ParamRef |  | Insets the bottom edge of the projection by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `projectionInsetLeft` | number \| ParamRef |  | Insets the left edge of the projection by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `projectionInsetRight` | number \| ParamRef |  | Insets the right edge of the projection by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `projectionInsetTop` | number \| ParamRef |  | Insets the top edge of the projection by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `projectionParallels` | object[] \| ParamRef |  | The [standard parallels][1]. For conic projections only. [1]: https://d3js.org/d3-geo/conic#conic_parallels |
| `projectionPrecision` | number \| ParamRef |  | The projection’s [sampling threshold][1]. [1]: https://d3js.org/d3-geo/projection#projection_precision |
| `projectionRotate` | object[] \| ParamRef |  | A rotation of the sphere before projection; defaults to [0, 0, 0]. Specified as Euler angles λ (yaw, or reference longitude), φ (pitch, or reference latitude), and optionally γ (roll), in degrees. |
| `projectionType` | ProjectionName \| null \| ParamRef |  | The desired projection; one of: - a named built-in projection such as *albers-usa* - null, for no projection Named projections are scaled and translated to fit the **domain** to the plot’s frame (minus insets). |
| `rBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `rClamp` | object |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `rConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `rDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Radius scales have a default domain from 0 to the median first quartile of associated channels. |
| `rExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `rLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. |
| `rNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `rPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `rRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Radius scales have a default range of [0, 3]. |
| `rScale` | ContinuousScaleType \| null \| ParamRef |  | The *r* (radius) scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. The radius scale defaults to *sqrt*; this scale is intended for quantitative data. |
| `rZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `style` | string \| CSSStyles \| null \| ParamRef |  | Custom styles to override Plot’s defaults. Styles may be specified either as a string of inline styles (*e.g.*, `"color: red;"`, in the same fashion as assigning [*element*.style][1]) or an object of properties (*e.g.*, `{color: "red"}`, in the same fashion as assigning [*element*.style properties][2]). Note that unitless numbers ([quirky lengths][3]) such as `{padding: 20}` may not supported by some browsers; you should instead specify a string with units such as `{padding: "20px"}`. By default, the returned plot has a max-width of 100%, and the system-ui font. Plot’s marks and axes default to [currentColor][4], meaning that they will inherit the surrounding content’s color. [1]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style [2]: https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration [3]: https://www.w3.org/TR/css-values-4/#deprecated-quirky-length [4]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentcolor_keyword |
| `symbolDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. As symbol scales are discrete, the domain is an array (or iterable) of values is the desired order, defaulting to natural ascending order. |
| `symbolRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For other ordinal data, such as for a *color* scale, it is an array (or iterable) of output values in the same order as the **domain**. Symbol scales have a default range of categorical symbols; the choice of symbols depends on whether the associated dot mark is filled or stroked. |
| `symbolScale` | DiscreteScaleType \| null \| ParamRef |  | The *symbol* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. Defaults to an *ordinal* scale type. |
| `width` | number \| ParamRef |  | The outer width of the plot in pixels, including margins. Defaults to 640. On Observable, this can be set to the built-in [width][1] for full-width responsive plots. Note: the default style has a max-width of 100%; the plot will automatically shrink to fit even when a fixed width is specified. [1]: https://github.com/observablehq/stdlib/blob/main/README.md#width |
| `xAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `xAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `xAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `xAxis` | "top" \| "bottom" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *top* or *bottom* for *x*. Defaults to *bottom* for an *x* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*top* and *bottom* for *x*). If null, the implicit axis is suppressed. |
| `xBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `xClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `xConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `xDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. Radius scales have a default domain from 0 to the median first quartile of associated channels. Length have a default domain from 0 to the median median of associated channels. Opacity scales have a default domain from 0 to the maximum value of associated channels. |
| `xExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `xFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `xGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `xInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `xInsetLeft` | number \| ParamRef |  | Insets the left edge by the specified number of pixels. A positive value insets towards the right edge (reducing effective area), while a negative value insets away from the right edge (increasing it). |
| `xInsetRight` | number \| ParamRef |  | Insets the right edge by the specified number of pixels. A positive value insets towards the left edge (reducing effective area), while a negative value insets away from the left edge (increasing it). |
| `xLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `xLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `xLabelArrow` | LabelArrow \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `xLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `xLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `xNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `xPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `xPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `xPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `xPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `xRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `xReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. |
| `xRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `xScale` | PositionScaleType \| null \| ParamRef |  | The *x* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, *categorical* for color scales, and otherwise *ordinal*. However, the radius scale defaults to *sqrt*, and the length and opacity scales default to *linear*; these scales are intended for quantitative data. The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale. |
| `xTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `xTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**. |
| `xTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `xTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `xTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `xTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `xZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |
| `xyDomain` | object[] \| Fixed \| ParamRef |  | Set the *x* and *y* scale domains. |
| `yAlign` | number \| ParamRef |  | How to distribute unused space in the **range** for *point* and *band* scales. A number in [0, 1], such as: - 0 - use the start of the range, putting unused space at the end - 0.5 (default) - use the middle, distributing unused space evenly - 1 use the end, putting unused space at the start For ordinal position scales only. |
| `yAriaDescription` | string \| ParamRef |  | A textual description for the axis in the accessibility tree. |
| `yAriaLabel` | string \| ParamRef |  | A short label representing the axis in the accessibility tree. |
| `yAxis` | "left" \| "right" \| "both" \| boolean \| null \| ParamRef |  | The side of the frame on which to place the implicit axis: *left* or *right* for *y*. Defaults to *left* for a *y* scale. If *both*, an implicit axis will be rendered on both sides of the plot (*left* and *right* for *y*). If null, the implicit axis is suppressed. |
| `yBase` | number \| ParamRef |  | A log scale’s base; defaults to 10. Does not affect the scale’s encoding, but rather the default ticks. For *log* scales only. |
| `yClamp` | boolean \| ParamRef |  | If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum. Clamping is useful for focusing on a subset of the data while ensuring that extreme values remain visible, but use caution: clamped values may need an annotation to avoid misinterpretation. Clamping typically requires setting an explicit **domain** since if the domain is inferred, no values will be outside the domain. For continuous scales only. |
| `yConstant` | number \| ParamRef |  | A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1. For *symlog* scales only. |
| `yDomain` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s inputs (abstract values). By default inferred from channel values. For continuous data (numbers and dates), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. For ordinal data (strings or booleans), it is an array (or iterable) of values is the desired order, defaulting to natural ascending order. Linear scales have a default domain of [0, 1]. Log scales have a default domain of [1, 10] and cannot include zero. |
| `yExponent` | number \| ParamRef |  | A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale. For *pow* scales only. |
| `yFontVariant` | string \| ParamRef |  | The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes. |
| `yGrid` | boolean \| string \| Interval \| object[] \| ParamRef |  | Whether to show a grid aligned with the scale’s ticks. If true, show a grid with the currentColor stroke; if a string, show a grid with the specified stroke color; if an approximate number of ticks, an interval, or an array of tick values, show corresponding grid lines. See also the grid mark. For axes only. |
| `yInset` | number \| ParamRef |  | Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**. All insets typically default to zero, though not always (say when using bin transform). A positive inset reduces effective area, while a negative inset increases it. |
| `yInsetBottom` | number \| ParamRef |  | Insets the bottom edge by the specified number of pixels. A positive value insets towards the top edge (reducing effective area), while a negative value insets away from the top edge (increasing it). |
| `yInsetTop` | number \| ParamRef |  | Insets the top edge by the specified number of pixels. A positive value insets towards the bottom edge (reducing effective area), while a negative value insets away from the bottom edge (increasing it). |
| `yLabel` | string \| null \| ParamRef |  | A textual label to show on the axis or legend; if null, show no label. By default the scale label is inferred from channel definitions, possibly with an arrow (↑, →, ↓, or ←) to indicate the direction of increasing value. For axes and legends only. |
| `yLabelAnchor` | "top" \| "right" \| "bottom" \| "left" \| "center" \| ParamRef |  | Where to place the axis **label** relative to the plot’s frame. For vertical position scales (*y* and *fy*), may be *top*, *bottom*, or *center*; for horizontal position scales (*x* and *fx*), may be *left*, *right*, or *center*. Defaults to *center* for ordinal scales (including *fx* and *fy*), and otherwise *top* for *y*, and *right* for *x*. |
| `yLabelArrow` | LabelArrow \| ParamRef |  | Whether to apply a directional arrow such as → or ↑ to the x-axis scale label. If *auto* (the default), the presence of the arrow depends on whether the scale is ordinal. |
| `yLabelOffset` | number \| ParamRef |  | The axis **label** position offset (in pixels); default depends on margins and orientation. |
| `yLine` | boolean \| ParamRef |  | If true, draw a line along the axis; if false (default), do not. |
| `yNice` | boolean \| number \| Interval \| ParamRef |  | If true, or a tick count or interval, extend the domain to nice round values. Defaults to 1, 2 or 5 times a power of 10 for *linear* scales, and nice time intervals for *utc* and *time* scales. Pass an interval such as *minute*, *wednesday* or *month* to specify what constitutes a nice interval. For continuous scales only. |
| `yPadding` | number \| ParamRef |  | For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%). For *point* scales, the amount of inset for the first and last value as a proportion of the bandwidth; defaults to 0.5 (50%). For ordinal position scales only. |
| `yPaddingInner` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to separate adjacent bands. |
| `yPaddingOuter` | number \| ParamRef |  | For a *band* scale, how much of the range to reserve to inset first and last bands. |
| `yPercent` | boolean \| ParamRef |  | If true, shorthand for a transform suitable for percentages, mapping proportions in [0, 1] to [0, 100]. |
| `yRange` | object[] \| Fixed \| ParamRef |  | The extent of the scale’s outputs (visual values). By default inferred from the scale’s **type** and **domain**, and for position scales, the plot’s dimensions. For continuous data (numbers and dates), and for ordinal position scales (*point* and *band*), it is typically [*min*, *max*]; it can be [*max*, *min*] to reverse the scale. |
| `yReverse` | boolean \| ParamRef |  | Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**. Note that by default, when the *y* scale is continuous, the *max* value points to the top of the screen, whereas ordinal values are ranked from top to bottom. |
| `yRound` | boolean \| ParamRef |  | If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering. For position scales only. |
| `yScale` | PositionScaleType \| null \| ParamRef |  | The *y* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation. If null, the scale is disabled. For quantitative data (numbers), defaults to *linear*; for temporal data (dates), defaults to *utc*; for ordinal data (strings or booleans), defaults to *point* for position scales, The plot’s marks may also impose a scale type; for example, the barY mark requires that *x* is a *band* scale. |
| `yTickFormat` | string \| null \| ParamRef |  | How to format inputs (abstract values) for axis tick labels; one of: - a [d3-format][1] string for numeric scales - a [d3-time-format][2] string for temporal scales [1]: https://d3js.org/d3-time [2]: https://d3js.org/d3-time-format |
| `yTickPadding` | number \| ParamRef |  | The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **yTickSize** and **yTickRotate**. |
| `yTickRotate` | number \| ParamRef |  | The rotation angle of axis tick labels in degrees clocksize; defaults to 0. |
| `yTickSize` | number \| ParamRef |  | The length of axis tick marks in pixels; negative values extend in the opposite direction. Defaults to 6 for *x* and *y* axes and *color* and *opacity* *ramp* legends, and 0 for *fx* and *fy* axes. |
| `yTickSpacing` | number \| ParamRef |  | The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*. |
| `yTicks` | number \| Interval \| object[] \| ParamRef |  | The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*. |
| `yZero` | boolean \| ParamRef |  | Whether the **domain** must include zero. If the domain minimum is positive, it will be set to zero; otherwise if the domain maximum is negative, it will be set to zero. For quantitative scales only. |

## PlotDataInline
An array of inline data values to visualize. As this data does not come from a database, it can not be filtered by interactive selections.

Type: `object[]`

## PlotFrom
Input data specification for a plot mark.


| Option | Type | Required | Description |
|---|---|---|---|
| `filterBy` | ParamRef |  | A selection that filters the mark data. |
| `from` | string \| ParamRef | yes | The name of the backing data table. |
| `optimize` | boolean |  | A flag (default `true`) to enable any mark-specific query optimizations. If `false`, optimizations are disabled to aid testing and debugging. |

## PlotInteractor
A plot interactor entry.

Type: `Highlight | IntervalX | IntervalY | IntervalXY | NearestX | NearestY | Pan | PanX | PanY | PanZoom | PanZoomX | PanZoomY | Region | Toggle | ToggleX | ToggleY | ToggleColor`

## PlotLegend
A legend defined as an entry within a plot.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef |  | The output selection. If specified, the legend is interactive, using a `toggle` interaction for discrete legends or an `intervalX` interaction for continuous legends. |
| `columns` | number |  | The number of columns to use to layout a discrete legend. |
| `field` | string |  | The data field over which to generate output selection clauses. If unspecified, a matching field is retrieved from existing plot marks. |
| `height` | number |  | The height of a continuous legend, in pixels. |
| `label` | string |  | The legend label. |
| `legend` | "color" \| "opacity" \| "symbol" | yes | A legend of the given type. The valid types are `"color"`, `"opacity"`, and `"symbol"`. |
| `marginBottom` | number |  | The bottom margin of the legend component, in pixels. |
| `marginLeft` | number |  | The left margin of the legend component, in pixels. |
| `marginRight` | number |  | The right margin of the legend component, in pixels. |
| `marginTop` | number |  | The top margin of the legend component, in pixels. |
| `tickSize` | number |  | The size of legend ticks in a continuous legend, in pixels. |
| `width` | number |  | The width of a continuous legend, in pixels. |

## PlotMark
A plot mark entry.

Type: `Area | AreaX | AreaY | Arrow | AxisX | AxisY | AxisFx | AxisFy | GridX | GridY | GridFx | GridFy | BarX | BarY | Cell | CellX | CellY | Contour | DelaunayLink | DelaunayMesh | Hull | Voronoi | VoronoiMesh | DenseLine | Density | DensityX | DensityY | Dot | DotX | DotY | Circle | Hexagon | ErrorBarX | ErrorBarY | Frame | Geo | Graticule | Sphere | Hexbin | Hexgrid | Image | Line | LineX | LineY | Link | Raster | Heatmap | RasterTile | Rect | RectX | RectY | RegressionY | RuleX | RuleY | Text | TextX | TextY | TickX | TickY | Vector | VectorX | VectorY | Spike | WaffleX | WaffleY`

## PlotMarkData
Input data for a marks

Type: `PlotDataInline | PlotFrom`

## PositionScaleType
The supported scale types for *x* and *y* position encodings. For quantitative data, one of: - *linear* (default) - linear transform (translate and scale) - *pow* - power (exponential) transform - *sqrt* - square-root transform; *pow* with *exponent* = 0.5 - *log* - logarithmic transform - *symlog* - bi-symmetric logarithmic transform per Webber et al. For temporal data, one of: - *utc* (default, recommended) - UTC time - *time* - local time For ordinal data, one of: - *point* (for position only) - divide a continuous range into discrete points - *band* (for position only) - divide a continuous range into discrete points Other scale types: - *identity* - do not transform values when encoding

Type: `"linear" | "pow" | "sqrt" | "log" | "symlog" | "utc" | "time" | "point" | "band" | "threshold" | "quantile" | "quantize" | "identity"`

## Product
A product aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `product` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the product of the given column. |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## ProjectionName
The built-in projection implementations; one of: - *albers-usa* - a U.S.-centric composite projection with insets for Alaska and Hawaii - *albers* - a U.S.-centric *conic-equal-area* projection - *azimuthal-equal-area* - the azimuthal equal-area projection - *azimuthal-equidistant* - the azimuthal equidistant projection - *conic-conformal* - the conic conformal projection - *conic-equal-area* - the conic equal-area projection - *conic-equidistant* - the conic equidistant projection - *equal-earth* - the Equal Earth projection Šavrič et al., 2018 - *equirectangular* - the equirectangular (plate carrée) projection - *gnomonic* - the gnomonic projection - *identity* - the identity projection - *reflect-y* - the identity projection, but flipping *y* - *mercator* - the spherical Mercator projection - *orthographic* - the orthographic projection - *stereographic* - the stereographic projection - *transverse-mercator* - the transverse spherical Mercator projection

Type: `"albers-usa" | "albers" | "azimuthal-equal-area" | "azimuthal-equidistant" | "conic-conformal" | "conic-equal-area" | "conic-equidistant" | "equal-earth" | "equirectangular" | "gnomonic" | "identity" | "reflect-y" | "mercator" | "orthographic" | "stereographic" | "transverse-mercator"`

## Quantile
A quantile aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `quantile` | string \| number \| boolean \| ParamRef[] | yes | Compute the quantile value of the given column at the provided probability threshold. For example, 0.5 is the median. |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Rank
A rank window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rank` | null \| any[] | yes | Compute the row rank over an ordered window partition. Sorting ties result in gaps in the rank numbers ([1, 1, 3, ...]). |
| `rows` | FrameValue[] \| ParamRef |  |  |

## Reducer
How to reduce aggregated (binned or grouped) values; one of: - *first* - the first value, in input order - *last* - the last value, in input order - *count* - the number of elements (frequency) - *distinct* - the number of distinct values - *sum* - the sum of values - *proportion* - the sum proportional to the overall total (weighted frequency) - *proportion-facet* - the sum proportional to the facet total - *deviation* - the standard deviation - *min* - the minimum value - *min-index* - the zero-based index of the minimum value - *max* - the maximum value - *max-index* - the zero-based index of the maximum value - *mean* - the mean value (average) - *median* - the median value - *variance* - the variance per [Welford’s algorithm][1] - *mode* - the value with the most occurrences - *pXX* - the percentile value, where XX is a number in [00,99] - *identity* - the array of values [1]: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm

Type: `"first" | "last" | "identity" | "count" | "distinct" | "sum" | "proportion" | "proportion-facet" | "deviation" | "min" | "min-index" | "max" | "max-index" | "mean" | "median" | "variance" | "mode" | ReducerPercentile`

## ReducerPercentile

Type: `"p00" | "p01" | "p02" | "p03" | "p04" | "p05" | "p06" | "p07" | "p08" | "p09" | "p10" | "p11" | "p12" | "p13" | "p14" | "p15" | "p16" | "p17" | "p18" | "p19" | "p20" | "p21" | "p22" | "p23" | "p24" | "p25" | "p26" | "p27" | "p28" | "p29" | "p30" | "p31" | "p32" | "p33" | "p34" | "p35" | "p36" | "p37" | "p38" | "p39" | "p40" | "p41" | "p42" | "p43" | "p44" | "p45" | "p46" | "p47" | "p48" | "p49" | "p50" | "p51" | "p52" | "p53" | "p54" | "p55" | "p56" | "p57" | "p58" | "p59" | "p60" | "p61" | "p62" | "p63" | "p64" | "p65" | "p66" | "p67" | "p68" | "p69" | "p70" | "p71" | "p72" | "p73" | "p74" | "p75" | "p76" | "p77" | "p78" | "p79" | "p80" | "p81" | "p82" | "p83" | "p84" | "p85" | "p86" | "p87" | "p88" | "p89" | "p90" | "p91" | "p92" | "p93" | "p94" | "p95" | "p96" | "p97" | "p98" | "p99"`

## Region
A rectangular region interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(field = value1) OR (field = value2) ...` is added for the currently selected values. |
| `brush` | BrushStyles |  | CSS styles for the brush (SVG `rect`) element. |
| `channels` | string[] | yes | The encoding channels over which to select values. For a selected mark, selection clauses will cover the backing data fields for each channel. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `select` | "region" | yes | Select aspects of individual marks within a 2D range. |

## RowNumber
A row_number window transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `row_number` | null \| any[] | yes | Compute the 1-based row number over an ordered window partition. |
| `rows` | FrameValue[] \| ParamRef |  |  |

## SQLExpression
A custom SQL expression.


| Option | Type | Required | Description |
|---|---|---|---|
| `label` | string |  | A label for this expression, for example to label a plot axis. |
| `sql` | string | yes | A SQL expression string to derive a new column value. Embedded Param references, such as `$param + 1`, are supported. For expressions with aggregate functions, use *agg* instead. |

## ScaleName
The built-in scale names; one of: - *x* - horizontal position - *y* - vertical position - *fx* - horizontal facet position - *fy* - vertical facet position - *r* - radius (for dots and point geos) - *color* - color - *opacity* - opacity - *symbol* - categorical symbol (for dots) - *length* - length (for vectors) Position scales may have associated axes. Color, opacity, and symbol scales may have an associated legend.

Type: `"x" | "y" | "fx" | "fy" | "r" | "color" | "opacity" | "symbol" | "length"`

## Search
A search input component.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef |  | The output selection. A selection clause is added for the current text search query. |
| `column` | string |  | The name of a database column from which to pull valid search results. The unique column values are used as search autocomplete values. Used in conjunction with the `from` property. |
| `field` | string |  | The database column name to use within generated selection clause predicates. Defaults to the `column` property. |
| `filterBy` | ParamRef |  | A selection to filter the database table indicated by the `from` property. |
| `from` | string |  | The name of a database table to use as an autocomplete data source for this widget. Used in conjunction with the `column` property. |
| `input` | "search" | yes | A text search input widget. |
| `label` | string |  | A text label for this input. |
| `type` | "contains" \| "prefix" \| "suffix" \| "regexp" |  | The type of text search query to perform. One of: - `"contains"` (default): the query string may appear anywhere in the text - `"prefix"`: the query string must appear at the start of the text - `"suffix"`: the query string must appear at the end of the text - `"regexp"`: the query string is a regular expression the text must match |

## Seconds
A date/time interval in units of seconds.


| Option | Type | Required | Description |
|---|---|---|---|
| `seconds` | number | yes | A date/time interval in units of seconds. |

## SelectFilter
Selection filters to apply internally to mark data.

Type: `"first" | "last" | "maxX" | "maxY" | "minX" | "minY" | "nearest" | "nearestX" | "nearestY"`

## Selection
A Selection definition.


| Option | Type | Required | Description |
|---|---|---|---|
| `cross` | boolean |  | A flag for cross-filtering, where selections made in a plot filter others but not oneself (default `false`, except for `crossfilter` selections). |
| `empty` | boolean |  | A flag for setting an initial empty selection state. If true, a selection with no clauses corresponds to an empty selection with no records. If false, a selection with no clauses selects all values. |
| `include` | ParamRef \| ParamRef[] |  | Upstream selections whose clauses should be included as part of this selection. Any clauses or activations published to the upstream selections will be relayed to this selection. |
| `select` | "crossfilter" \| "intersect" \| "single" \| "union" | yes | The type of reactive parameter. One of: - `"value"` (default) for a standard `Param` - `"intersect"` for a `Selection` that intersects clauses (logical "and") - `"union"` for a `Selection` that unions clauses (logical "or") - `"single"` for a `Selection` that retains a single clause only - `"crossfilter"` for a cross-filtered intersection `Selection` |

## Slider
A slider input component.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef |  | The output selection. A selection clause is added for the currently selected slider option. |
| `column` | string |  | The name of a database column whose values determine the slider range. Used in conjunction with the `from` property. The minimum and maximum values of the column determine the slider range. |
| `field` | string |  | The database column name to use within generated selection clause predicates. Defaults to the `column` property. |
| `filterBy` | ParamRef |  | A selection to filter the database table indicated by the `from` property. |
| `from` | string |  | The name of a database table to use as a data source for this widget. Used in conjunction with the `column` property. The minimum and maximum values of the column determine the slider range. |
| `input` | "slider" | yes | A slider input widget. |
| `label` | string |  | A text label for this input. |
| `max` | number |  | The maximum slider value. |
| `min` | number |  | The minimum slider value. |
| `select` | "point" \| "interval" |  | The type of selection clause predicate to generate if the **as** option is a Selection. If `'point'` (the default), the selection predicate is an equality check for the slider value. If `'interval'`, the predicate checks an interval from the minimum to the current slider value. |
| `step` | number |  | The slider step, the amount to increment between consecutive values. |
| `value` | number |  | The initial slider value. |
| `width` | number |  | The width of the slider in screen pixels. |

## SortOrder
How to order values; one of: - a function for comparing data, returning a signed number - a channel value definition for sorting given values in ascending order - a {value, order} object for sorting given values - a {channel, order} object for sorting the named channel’s values

Type: `ChannelValue | object`

## StackOffset
A stack offset method; one of: - *normalize* - rescale each stack to fill [0, 1] - *center* - align the centers of all stacks - *wiggle* - translate stacks to minimize apparent movement If a given stack has zero total value, the *normalize* offset will not adjust the stack’s position. Both the *center* and *wiggle* offsets ensure that the lowest element across stacks starts at zero for better default axes. The *wiggle* offset is recommended for streamgraphs in conjunction with the *inside-out* order. For more, see [Byron & Wattenberg][1]. [1]: https://leebyron.com/streamgraph/

Type: `StackOffsetName`

## StackOffsetName
A built-in stack offset method; one of: - *normalize* - rescale each stack to fill [0, 1] - *center* - align the centers of all stacks - *wiggle* - translate stacks to minimize apparent movement If a given stack has zero total value, the *normalize* offset will not adjust the stack’s position. Both the *center* and *wiggle* offsets ensure that the lowest element across stacks starts at zero for better default axes. The *wiggle* offset is recommended for streamgraphs in conjunction with the *inside-out* order. For more, see [Byron & Wattenberg][1]. [1]: https://leebyron.com/streamgraph/

Type: `"center" | "normalize" | "wiggle"`

## StackOrder
How to order layers prior to stacking; one of: - a named stack order method such as *inside-out* or *sum* - a field name, for natural order of the corresponding values - an array of explicit **z** values in the desired order

Type: `StackOrderName | "-value" | "-x" | "-y" | "-z" | "-sum" | "-appearance" | "-inside-out" | string | object[]`

## StackOrderName
The built-in stack order methods; one of: - *x* - alias of *value*; for stackX only - *y* - alias of *value*; for stackY only - *value* - ascending value (or descending with **reverse**) - *sum* - total value per series - *appearance* - position of maximum value per series - *inside-out* (default with *wiggle*) - order the earliest-appearing series on the inside The *inside-out* order is recommended for streamgraphs in conjunction with the *wiggle* offset. For more, see [Byron & Wattenberg][1]. [1]: https://leebyron.com/streamgraph/

Type: `"value" | "x" | "y" | "z" | "sum" | "appearance" | "inside-out"`

## Stddev
A sample standard deviation aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |
| `stddev` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the sum of the given column. |

## StddevPop
A population standard deviation aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |
| `stddevPop` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the sum of the given column. |

## Sum
A sum aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |
| `sum` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the sum of the given column. |

## SymbolType
The built-in symbol implementations. For fill, one of: - *circle* - a circle - *cross* - a Greek cross with arms of equal length - *diamond* - a rhombus - *square* - a square - *star* - a pentagonal star (pentagram) - *triangle* - an up-pointing triangle - *wye* - a Y with arms of equal length For stroke (based on [Heman Robinson’s research][1]), one of: - *circle* - a circle - *plus* - a plus sign - *times* - an X with arms of equal length - *triangle2* - an (alternate) up-pointing triangle - *asterisk* - an asterisk - *square2* - a (alternate) square - *diamond2* - a rotated square The *hexagon* symbol is also supported. [1]: https://www.tandfonline.com/doi/abs/10.1080/10618600.2019.1637746

Type: `"asterisk" | "circle" | "cross" | "diamond" | "diamond2" | "hexagon" | "plus" | "square" | "square2" | "star" | "times" | "triangle" | "triangle2" | "wye"`

## Table
A table grid view component.


| Option | Type | Required | Description |
|---|---|---|---|
| `align` | object |  | An object of per-column alignment values. Column names should be object keys, which map to alignment values. Valid alignment values are: `"left"`, `"right"`, `"center"`, and `"justify"`. By default, numbers are right-aligned and other values are left-aligned. |
| `as` | ParamRef |  | The output selection. A selection clause is added for each currently selected table row. |
| `columns` | string[] |  | A list of column names to include in the table grid. If unspecified, all table columns are included. |
| `filterBy` | ParamRef |  | A selection to filter the database table indicated by the `from` property. |
| `from` | string \| ParamRef | yes | The name of a database table to use as a data source for this widget. |
| `height` | number |  | The height of the table widget, in pixels. |
| `input` | "table" | yes | A table grid widget. |
| `maxWidth` | number |  | The maximum width of the table widget, in pixels. |
| `rowBatch` | number |  | The number of rows load in a new batch upon table scroll. |
| `width` | number \| object |  | If a number, sets the total width of the table widget, in pixels. If an object, provides per-column pixel width values. Column names should be object keys, mapped to numeric width values. |

## TimeIntervalName
The built-in time intervals; UTC or local time, depending on context. The *week* interval is an alias for *sunday*. The *quarter* interval is every three months, and the *half* interval is every six months, aligned at the start of the year.

Type: `"second" | "minute" | "hour" | "day" | "week" | "month" | "quarter" | "half" | "year" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"`

## TipPointer
The pointer mode for the tip; corresponds to pointerX, pointerY, and pointer.

Type: `"x" | "y" | "xy"`

## Toggle
A toggle interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(field = value1) OR (field = value2) ...` is added for the currently selected values. |
| `channels` | string[] | yes | The encoding channels over which to select values. For a selected mark, selection clauses will cover the backing data fields for each channel. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `select` | "toggle" | yes | Select individual values. |

## ToggleColor
A toggleColor interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(field = value1) OR (field = value2) ...` is added for the currently selected values. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `select` | "toggleColor" | yes | Select individual values in the `color` scale domain. Clicking or touching a mark toggles its selection status. |

## ToggleX
A toggleX interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(field = value1) OR (field = value2) ...` is added for the currently selected values. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `select` | "toggleX" | yes | Select individual values in the `x` scale domain. Clicking or touching a mark toggles its selection status. |

## ToggleY
A toggleY interactor.


| Option | Type | Required | Description |
|---|---|---|---|
| `as` | ParamRef | yes | The output selection. A clause of the form `(field = value1) OR (field = value2) ...` is added for the currently selected values. |
| `peers` | boolean |  | A flag indicating if peer (sibling) marks are excluded when cross-filtering (default `true`). If set, peer marks will not be filtered by this interactor's selection in cross-filtering setups. |
| `select` | "toggleY" | yes | Select individual values in the `y` scale domain. Clicking or touching a mark toggles its selection status. |

## Transform
A data transform.

Type: `ColumnTransform | AggregateTransform | WindowTransform`

## TransformField
A field argument to a data transform.

Type: `string | ParamRef`

## VConcat
A vconcat component.


| Option | Type | Required | Description |
|---|---|---|---|
| `vconcat` | Component[] | yes | Vertically concatenate components in a column layout. |

## VSpace
A vspace component.


| Option | Type | Required | Description |
|---|---|---|---|
| `vspace` | number \| string | yes | Vertical space to place between components. Number values indicate screen pixels. String values may use CSS units (em, pt, px, etc). |

## VarPop
A population variance aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |
| `varPop` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the population variance of the given column. |

## Variance
A sample variance aggregate transform.


| Option | Type | Required | Description |
|---|---|---|---|
| `distinct` | boolean |  |  |
| `exclude` | "CURRENT ROW" \| "GROUP" \| "TIES" \| "NO OTHERS" \| "current row" \| "group" \| "ties" \| "no others" |  |  |
| `groups` | FrameValue[] \| ParamRef |  |  |
| `orderby` | TransformField \| TransformField[] |  |  |
| `partitionby` | TransformField \| TransformField[] |  |  |
| `range` | FrameValue[] \| ParamRef |  |  |
| `rows` | FrameValue[] \| ParamRef |  |  |
| `variance` | string \| number \| boolean \| ParamRef \| string \| number \| boolean \| ParamRef[] | yes | Compute the sample variance of the given column. |

## VectorShape
How to draw a vector: either a named shape or a custom implementation.

Type: `VectorShapeName`

## VectorShapeName
The built-in vector shape implementations; one of: - *arrow* - a straight line with an open arrowhead at the end (↑) - *spike* - an isosceles triangle with a flat base (▲)

Type: `"arrow" | "spike"`

## WindowTransform
A window transform that operates over a sorted domain.

Type: `RowNumber | Rank | DenseRank | PercentRank | CumeDist | NTile | Lag | Lead | FirstValue | LastValue | NthValue`

## Years
A date/time interval in units of years.


| Option | Type | Required | Description |
|---|---|---|---|
| `years` | number | yes | A date/time interval in units of years. |
