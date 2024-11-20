import { AggregateExpression, SQLExpression } from '../Expression.js';
import { ParamRef } from '../Param.js';
import { PlotMarkData } from '../PlotFrom.js';
import { CurveName, FrameAnchor, Interval, Reducer, ScaleName } from '../PlotTypes.js';
import { Transform } from '../Transform.js';

/** The set of known channel names. */
export type ChannelName =
  | 'ariaLabel'
  | 'fill'
  | 'fillOpacity'
  | 'fontSize'
  | 'fx'
  | 'fy'
  | 'geometry'
  | 'height'
  | 'href'
  | 'length'
  | 'opacity'
  | 'path'
  | 'r'
  | 'rotate'
  | 'src'
  | 'stroke'
  | 'strokeOpacity'
  | 'strokeWidth'
  | 'symbol'
  | 'text'
  | 'title'
  | 'weight'
  | 'width'
  | 'x'
  | 'x1'
  | 'x2'
  | 'y'
  | 'y1'
  | 'y2'
  | 'z';

type ChannelScale = ScaleName | 'auto' | boolean | null;

/**
 * A channel’s values may be expressed as:
 *
 * - a field name, to extract the corresponding value for each datum
 * - an iterable of values, typically of the same length as the data
 * - a channel transform or SQL expression
 * - a constant number or boolean
 * - null to represent no value
 */
export type ChannelValue =
  | any[] // column of values
  | (string & Record<never, never>) // field or literal color; see also https://github.com/microsoft/TypeScript/issues/29729
  | number // constant
  | boolean // constant
  | null // constant
  | Transform
  | SQLExpression
  | AggregateExpression;

/**
 * When specifying a mark channel’s value, you can provide a {value, scale}
 * object to override the scale that would normally be associated with the
 * channel.
 */
export type ChannelValueSpec =
  | ChannelValue
  | {
      value: ChannelValue;
      label?: string;
      scale?: ScaleName | 'auto' | boolean | null;
    };

/**
 * In some contexts, when specifying a mark channel’s value, you can provide a
 * {value, interval} object to specify an associated interval.
 */
export type ChannelValueIntervalSpec =
  | ChannelValueSpec
  | { value: ChannelValue; interval: Interval };

/** A channel name, or an implied one for domain sorting. */
type ChannelDomainName = ChannelName | 'data' | 'width' | 'height';

/**
 * The available inputs for imputing scale domains. In addition to a named
 * channel, an input may be specified as:
 *
 * - *data* - impute from mark data
 * - *width* - impute from |*x2* - *x1*|
 * - *height* - impute from |*y2* - *y1*|
 * - null - impute from input order
 *
 * If the *x* channel is not defined, the *x2* channel will be used instead if
 * available, and similarly for *y* and *y2*; this is useful for marks that
 * implicitly stack. The *data* input is typically used in conjunction with a
 * custom **reduce** function, as when the built-in single-channel reducers are
 * insufficient.
 */
export type ChannelDomainValue = ChannelDomainName | `-${ChannelDomainName}` | null;

/** Options for imputing scale domains from channel values. */
export interface ChannelDomainOptions {
  /**
   * How to produce a singular value (for subsequent sorting) from aggregated
   * channel values; one of:
   *
   * - true (default) - alias for *max*
   * - false or null - disabled; don’t impute the scale domain
   * - a named reducer implementation such as *count* or *sum*
   * - a function that takes an array of values and returns the reduced value
   * - an object that implements the *reduceIndex* method
   */
  reduce?: Reducer | boolean | null;

  /** How to order reduced values. */
  order?: 'ascending' | 'descending' | null;

  /** If true, reverse the order after sorting. */
  reverse?: boolean;

  /**
   * If a positive number, limit the domain to the first *n* sorted values. If a
   * negative number, limit the domain to the last *-n* sorted values. Hence, a
   * positive **limit** with **reverse** true will return the top *n* values in
   * descending order.
   *
   * If an array [*lo*, *hi*], slices the sorted domain from *lo* (inclusive) to
   * *hi* (exclusive). As with [*array*.slice][1], if either *lo* or *hi* are
   * negative, it indicates an offset from the end of the array; if *lo* is
   * undefined it defaults to 0, and if *hi* is undefined it defaults to
   * Infinity.
   *
   * Note: limiting the imputed domain of one scale, say *x*, does not affect
   * the imputed domain of another scale, say *y*; each scale domain is imputed
   * independently.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
   */
  limit?: number | [lo?: number, hi?: number];
}

/** How to derive a scale’s domain from a channel’s values. */
export type ChannelDomainValueSpec =
  | ChannelDomainValue
  | ({ value: ChannelDomainValue } & ChannelDomainOptions);

/** How to impute scale domains from channel values. */
export type ChannelDomainSort = {
  [key in ScaleName]?: ChannelDomainValueSpec
} & ChannelDomainOptions;

/**
 * Output channels for aggregating transforms, such as bin and group. Each
 * declared output channel has an associated reducer, and typically a
 * corresponding input channel in *options*. Non-grouping channels declared in
 * *options* but not *outputs* are computed on reduced data after grouping,
 * which defaults to the array of data for the current group.
 *
 * If **title** is in *options* but not *outputs*, the reducer defaults to
 * summarizing the most common values. If **href** is in *options* but not
 * *outputs*, the reducer defaults to *first*. When **x1** or **x2** is in
 * *outputs*, reads the input channel **x** if **x1** or **x2** is not in
 * *options*; likewise for **y1** or **y2**, reads the input channel **y** if
 * **y1** or **y2** is not in *options*.
 */
export type ChannelReducers<T = Reducer> = {
  [key in ChannelName]?: T | { reduce: T; scale?: ChannelScale } | null
};

/** Abstract (unscaled) values, and associated scale, per channel. */
export type ChannelStates = {
  [key in ChannelName]?: { value: any[]; scale: ScaleName | null }
};

/** Possibly-scaled values for each channel. */
export type ChannelValues = {
  [key in ChannelName]?: any[]
} & { channels: ChannelStates };

/**
 * How to order values; one of:
 *
 * - a function for comparing data, returning a signed number
 * - a channel value definition for sorting given values in ascending order
 * - a {value, order} object for sorting given values
 * - a {channel, order} object for sorting the named channel’s values
 */
export type SortOrder =
  | ChannelValue
  | { value?: ChannelValue; order?: 'ascending' | 'descending' }
  | { channel?: ChannelName | `-${ChannelName}`; order?: 'ascending' | 'descending' };

/** The pointer mode for the tip; corresponds to pointerX, pointerY, and pointer. */
export type TipPointer = 'x' | 'y' | 'xy';

/** Selection filters to apply internally to mark data. */
export type SelectFilter =
  | 'first'
  | 'last'
  | 'maxX'
  | 'maxY'
  | 'minX'
  | 'minY'
  | 'nearest'
  | 'nearestX'
  | 'nearestY';

export interface MarkData {
  /**
   * The data source for the mark.
   */
  data: PlotMarkData;
}

export interface MarkDataOptional {
  /**
   * The data source for the mark.
   */
  data?: PlotMarkData;
}

/** Shared options for all marks. */
export interface MarkOptions {
  /**
   * Applies a transform to filter the mark’s index according to the given
   * channel values; only truthy values are retained.
   *
   * Note that filtering only affects the rendered mark index, not the
   * associated channel values, and has no effect on imputed scale domains.
   */
  filter?: ChannelValue;

  /**
   * Applies a filter transform after data is loaded to highlight selected
   * values only. For example, `first` and `last` select the first or last
   * values of series only (using the *z* channel to separate series).
   * Meanwhile, `nearestX` and `nearestY` select the point nearest to the
   * pointer along the *x* or *y* channel dimension. Unlike Mosaic selections,
   * a mark level *select* is internal to the mark only, and does not populate
   * a param or selection value to be shared across clients.
   *
   * Note that filtering only affects the rendered mark index, not the
   * associated channel values, and has no effect on imputed scale domains.
   */
  select?: SelectFilter;

  /**
   * Applies a transform to reverse the order of the mark’s index, say for
   * reverse input order.
   */
  reverse?: boolean | ParamRef;

  /**
   * Either applies a transform to sort the mark’s index by the specified
   * channel values, or imputes ordinal scale domains from this mark’s channels.
   *
   * When imputing ordinal scale domains from channel values, the **sort**
   * option is an object whose keys are ordinal scale names such as *x* or *fx*,
   * and whose values are channel names such as *y*, *y1*, or *y2*. For example,
   * to impute the *y* scale’s domain from the associated *x* channel values in
   * ascending order:
   *
   * ```js
   * sort: {y: "x"}
   * ```
   *
   * For different sort options for different scales, replace the channel name
   * with a *value* object and per-scale options:
   *
   * ```js
   * sort: {y: {value: "-x"}}
   * ```
   *
   * When sorting the mark’s index, the **sort** option is instead one of:
   *
   * - a channel value definition for sorting given values in ascending order
   * - a {value, order} object for sorting given values
   * - a {channel, order} object for sorting the named channel’s values
   */
  sort?: SortOrder | ChannelDomainSort;

  /**
   * The horizontal facet position channel, for mark-level faceting, bound to
   * the *fx* scale.
   */
  fx?: ChannelValue;

  /**
   * The vertical facet position channel, for mark-level faceting, bound to the
   * *fy* scale.
   */
  fy?: ChannelValue;

  /**
   * Whether to enable or disable faceting; one of:
   *
   * - *auto* (default) - automatically determine if this mark should be faceted
   * - *include* (or true) - draw the subset of the mark’s data in the current facet
   * - *exclude* - draw the subset of the mark’s data *not* in the current facet
   * - *super* - draw this mark in a single frame that covers all facets
   * - null (or false) - repeat this mark’s data across all facets (*i.e.*, no faceting)
   *
   * When a mark uses *super* faceting, it is not allowed to use position scales
   * (*x*, *y*, *fx*, or *fy*); *super* faceting is intended for decorations,
   * such as labels and legends.
   *
   * When top-level faceting is used, the default *auto* setting is equivalent
   * to *include* when the mark data is strictly equal to the top-level facet
   * data; otherwise it is equivalent to null. When the *include* or *exclude*
   * facet mode is chosen, the mark data must be parallel to the top-level facet
   * data: the data must have the same length and order. If the data are not
   * parallel, then the wrong data may be shown in each facet. The default
   * *auto* therefore requires strict equality (`===`) for safety, and using the
   * facet data as mark data is recommended when using the *exclude* facet mode.
   * (To construct parallel data safely, consider using [*array*.map][1] on the
   * facet data.)
   *
   * When mark-level faceting is used, the default *auto* setting is equivalent
   * to *include*: the mark will be faceted if either the **fx** or **fy**
   * channel option (or both) is specified. The null or false option will
   * disable faceting, while *exclude* draws the subset of the mark’s data *not*
   * in the current facet.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
   */
  facet?: 'auto' | 'include' | 'exclude' | 'super' | boolean | null | ParamRef;

  /**
   * How to place the mark with respect to facets; one of:
   *
   * - null (default for most marks) - display the mark in each non-empty facet
   * - *top*, *right*, *bottom*, or *left* - display the mark only in facets on
   *   the given side
   * - *top-empty*, *right-empty*, *bottom-empty*, or *left-empty* (default for
   *   axis marks) - display the mark only in facets that have empty space on
   *   the given side: either the margin, or an empty facet
   * - *empty* - display the mark in empty facets only
   */
  facetAnchor?:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-empty'
    | 'right-empty'
    | 'bottom-empty'
    | 'left-empty'
    | 'empty'
    | null
    | ParamRef;

  /**
   * Shorthand to set the same default for all four mark margins: **marginTop**,
   * **marginRight**, **marginBottom**, and **marginLeft**; typically defaults
   * to 0, except for axis marks.
   */
  margin?: number | ParamRef;

  /**
   * The mark’s top margin; the minimum distance in pixels between the top edges
   * of the inner and outer plot area.
   */
  marginTop?: number | ParamRef;

  /**
   * The mark’s right margin; the minimum distance in pixels between the right
   * edges of the mark’s inner and outer plot area.
   */
  marginRight?: number | ParamRef;

  /**
   * The mark’s bottom margin; the minimum distance in pixels between the bottom
   * edges of the inner and outer plot area.
   */
  marginBottom?: number | ParamRef;

  /**
   * The mark’s left margin; the minimum distance in pixels between the left
   * edges of the inner and outer plot area.
   */
  marginLeft?: number | ParamRef;

  /**
   * The [aria-description][1]; a constant textual description.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-description
   */
  ariaDescription?: string | ParamRef;

  /**
   * The [aria-hidden][1] state; a constant indicating whether the element is
   * exposed to an accessibility API.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-hidden
   */
  ariaHidden?: string | ParamRef;

  /**
   * The [aria-label][1]; a channel specifying short textual labels representing
   * the value in the accessibility tree.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-label
   */
  ariaLabel?: ChannelValue;

  /**
   * The [pointer-events][1] property; a constant string such as *none*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
   */
  pointerEvents?: string | ParamRef;

  /**
   * The title; a channel specifying accessible, short textual descriptions as
   * strings (possibly with newlines). If the tip option is specified, the title
   * will be displayed with an interactive tooltip instead of using the SVG
   * [title element][1].
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
   */
  title?: ChannelValue;

  /** Whether to generate a tooltip for this mark, and any tip options. */
  tip?:
    | boolean
    | TipPointer
    | (TipOptions & { pointer?: TipPointer })
    | ParamRef;

  /**
   * Additional named channels, for example to include in a tooltip.
   * Consists of (channel name, data field name) key-value pairs.
   */
  channels?: Record<string, string>;

  /**
   * How to clip the mark; one of:
   *
   * - *frame* or true - clip to the plot’s frame (inner area)
   * - *sphere* - clip to the projected sphere (*e.g.*, front hemisphere)
   * - null or false - do not clip
   *
   * The *sphere* clip option requires a geographic projection.
   */
  clip?: 'frame' | 'sphere' | boolean | null | ParamRef;

  /**
   * The horizontal offset in pixels; a constant option. On low-density screens,
   * an additional 0.5px offset may be applied for crisp edges.
   */
  dx?: number | ParamRef;

  /**
   * The vertical offset in pixels; a constant option. On low-density screens,
   * an additional 0.5px offset may be applied for crisp edges.
   */
  dy?: number | ParamRef;

  /**
   * The [fill][1]; a constant CSS color string, or a channel typically bound to
   * the *color* scale. If all channel values are valid CSS colors, by default
   * the channel will not be bound to the *color* scale, interpreting the colors
   * literally.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill
   */
  fill?: ChannelValueSpec | ParamRef;

  /**
   * The [fill-opacity][1]; a constant number between 0 and 1, or a channel
   * typically bound to the *opacity* scale. If all channel values are numbers
   * in [0, 1], by default the channel will not be bound to the *opacity* scale,
   * interpreting the opacities literally.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/fill-opacity
   */
  fillOpacity?: ChannelValueSpec | ParamRef;

  /**
   * The [stroke][1]; a constant CSS color string, or a channel typically bound
   * to the *color* scale. If all channel values are valid CSS colors, by
   * default the channel will not be bound to the *color* scale, interpreting
   * the colors literally.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke
   */
  stroke?: ChannelValueSpec | ParamRef;

  /**
   * The [stroke-dasharray][1]; a constant number indicating the length in
   * pixels of alternating dashes and gaps, or a constant string of numbers
   * separated by spaces or commas (_e.g._, *10 2* for dashes of 10 pixels
   * separated by gaps of 2 pixels), or *none* (the default) for no dashing
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
   */
  strokeDasharray?: string | number | ParamRef;

  /**
   * The [stroke-dashoffset][1]; a constant indicating the offset in pixels of
   * the first dash along the stroke; defaults to zero.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset
   */
  strokeDashoffset?: string | number | ParamRef;

  /**
   * The [stroke-linecap][1]; a constant specifying how to cap stroked paths,
   * such as *butt*, *round*, or *square*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap
   */
  strokeLinecap?: string | ParamRef;

  /**
   * The [stroke-linejoin][1]; a constant specifying how to join stroked paths,
   * such as *bevel*, *miter*, *miter-clip*, or *round*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin
   */
  strokeLinejoin?: string | ParamRef;

  /**
   * The [stroke-miterlimit][1]; a constant number specifying how to limit the
   * length of *miter* joins on stroked paths.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-miterlimit
   */
  strokeMiterlimit?: number | ParamRef;

  /**
   * The [stroke-opacity][1]; a constant between 0 and 1, or a channel typically
   * bound to the *opacity* scale. If all channel values are numbers in [0, 1],
   * by default the channel will not be bound to the *opacity* scale,
   * interpreting the opacities literally.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-opacity
   */
  strokeOpacity?: ChannelValueSpec;

  /**
   * The [stroke-width][1]; a constant number in pixels, or a channel.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-width
   */
  strokeWidth?: ChannelValueSpec;

  /**
   * The [opacity][1]; a constant between 0 and 1, or a channel typically bound
   * to the *opacity* scale. If all channel values are numbers in [0, 1], by
   * default the channel will not be bound to the *opacity* scale, interpreting
   * the opacities literally. For faster rendering, prefer the **strokeOpacity**
   * or **fillOpacity** option.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/opacity
   */
  opacity?: ChannelValueSpec;

  /**
   * The [mix-blend-mode][1]; a constant string specifying how to blend content
   * such as *multiply*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/mix-blend-mode
   */
  mixBlendMode?: string | ParamRef;

  /**
   * A CSS [filter][1]; a constant string used to adjust the rendering of
   * images, such as *blur(5px)*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/filter
   */
  imageFilter?: string | ParamRef;

  /**
   * The [paint-order][1]; a constant string specifying the order in which the
   * **fill**, **stroke**, and any markers are drawn; defaults to *normal*,
   * which draws the fill, then stroke, then markers; defaults to *stroke* for
   * the text mark to create a “halo” around text to improve legibility.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/paint-order
   */
  paintOrder?: string | ParamRef;

  /**
   * The [shape-rendering][1]; a constant string such as *crispEdges*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/shape-rendering
   */
  shapeRendering?: string | ParamRef;

  /**
   * The [href][1]; a channel specifying URLs for clickable links. May be used
   * in conjunction with the **target** option to open links in another window.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/href
   */
  href?: ChannelValue;

  /**
   * The [target][1]; a constant string specifying the target window (_e.g._,
   * *_blank*) for clickable links; used in conjunction with the **href**
   * option.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/target
   */
  target?: string | ParamRef;
}

/** Options for insetting rectangular shapes. */
export interface InsetOptions {
  /**
   * Shorthand to set the same default for all four insets: **insetTop**,
   * **insetRight**, **insetBottom**, and **insetLeft**. All insets typically
   * default to zero, though not always (say when using bin transform). A
   * positive inset reduces effective area, while a negative inset increases it.
   */
  inset?: number | ParamRef;

  /**
   * Insets the top edge by the specified number of pixels. A positive value
   * insets towards the bottom edge (reducing effective area), while a negative
   * value insets away from the bottom edge (increasing it).
   */
  insetTop?: number | ParamRef;

  /**
   * Insets the right edge by the specified number of pixels. A positive value
   * insets towards the left edge (reducing effective area), while a negative
   * value insets away from the left edge (increasing it).
   */
  insetRight?: number | ParamRef;

  /**
   * Insets the bottom edge by the specified number of pixels. A positive value
   * insets towards the top edge (reducing effective area), while a negative
   * value insets away from the top edge (increasing it).
   */
  insetBottom?: number | ParamRef;

  /**
   * Insets the left edge by the specified number of pixels. A positive value
   * insets towards the right edge (reducing effective area), while a negative
   * value insets away from the right edge (increasing it).
   */
  insetLeft?: number | ParamRef;
}

/** Options for styling text (independent of anchor position). */
export interface TextStyles {
  /**
   * The [text anchor][1] controls how text is aligned (typically horizontally)
   * relative to its anchor point; it is one of *start*, *end*, or *middle*. If
   * the frame anchor is *left*, *top-left*, or *bottom-left*, the default text
   * anchor is *start*; if the frame anchor is *right*, *top-right*, or
   * *bottom-right*, the default is *end*; otherwise it is *middle*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/text-anchor
   */
  textAnchor?: 'start' | 'middle' | 'end' | ParamRef;

  /**
   * The line height in ems; defaults to 1. The line height affects the
   * (typically vertical) separation between adjacent baselines of text, as well
   * as the separation between the text and its anchor point.
   */
  lineHeight?: number | ParamRef;

  /**
   * The line width in ems (e.g., 10 for about 20 characters); defaults to
   * infinity, disabling wrapping and clipping.
   *
   * If **textOverflow** is null, lines will be wrapped at the specified length.
   * If a line is split at a soft hyphen (\xad), a hyphen (-) will be displayed
   * at the end of the line. If **textOverflow** is not null, lines will be
   * clipped according to the given strategy.
   */
  lineWidth?: number | ParamRef;

  /**
   * How truncate (or wrap) lines of text longer than the given **lineWidth**;
   * one of:
   *
   * - null (default) - preserve overflowing characters (and wrap if needed)
   * - *clip* or *clip-end* - remove characters from the end
   * - *clip-start* - remove characters from the start
   * - *ellipsis* or *ellipsis-end* - replace characters from the end with an ellipsis (…)
   * - *ellipsis-start* - replace characters from the start with an ellipsis (…)
   * - *ellipsis-middle* - replace characters from the middle with an ellipsis (…)
   *
   * If no **title** was specified, if text requires truncation, a title
   * containing the non-truncated text will be implicitly added.
   */
  textOverflow?:
    | null
    | 'clip'
    | 'ellipsis'
    | 'clip-start'
    | 'clip-end'
    | 'ellipsis-start'
    | 'ellipsis-middle'
    | 'ellipsis-end'
    | ParamRef;

  /**
   * If true, changes the default **fontFamily** to *monospace*, and uses
   * simplified monospaced text metrics calculations.
   */
  monospace?: boolean | ParamRef;

  /**
   * The [font-family][1]; a constant; defaults to the plot’s font family, which
   * is typically [*system-ui*][2].
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-family
   * [2]: https://drafts.csswg.org/css-fonts-4/#valdef-font-family-system-ui
   */
  fontFamily?: string | ParamRef;

  /**
   * The [font size][1] in pixels; either a constant or a channel; defaults to
   * the plot’s font size, which is typically 10. When a number, it is
   * interpreted as a constant; otherwise it is interpreted as a channel.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-size
   */
  fontSize?: ChannelValue | ParamRef;

  /**
   * The [font style][1]; a constant; defaults to the plot’s font style, which
   * is typically *normal*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-style
   */
  fontStyle?: string | ParamRef;

  /**
   * The [font variant][1]; a constant; if the **text** channel contains numbers
   * or dates, defaults to *tabular-nums* to facilitate comparing numbers;
   * otherwise defaults to the plot’s font style, which is typically *normal*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant
   */
  fontVariant?: string | ParamRef;

  /**
   * The [font weight][1]; a constant; defaults to the plot’s font weight, which
   * is typically *normal*.
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight
   */
  fontWeight?: string | number | ParamRef;
}

/** Options for the tip mark. */
export interface TipOptions extends MarkOptions, TextStyles {
  /**
   * The horizontal position channel specifying the tip’s anchor, typically
   * bound to the *x* scale.
   */
  x?: ChannelValueSpec;

  /**
   * The starting horizontal position channel specifying the tip’s anchor,
   * typically bound to the *x* scale.
   */
  x1?: ChannelValueSpec;

  /**
   * The ending horizontal position channel specifying the tip’s anchor,
   * typically bound to the *x* scale.
   */
  x2?: ChannelValueSpec;

  /**
   * The vertical position channel specifying the tip’s anchor, typically
   * bound to the *y* scale.
   */
  y?: ChannelValueSpec;

  /**
   * The starting vertical position channel specifying the tip’s anchor,
   * typically bound to the *y* scale.
   */
  y1?: ChannelValueSpec;

  /**
   * The ending vertical position channel specifying the tip’s anchor, typically
   * bound to the *y* scale.
   */
  y2?: ChannelValueSpec;

  /**
   * The frame anchor specifies defaults for **x** and **y** based on the plot’s
   * frame; it may be one of the four sides (*top*, *right*, *bottom*, *left*),
   * one of the four corners (*top-left*, *top-right*, *bottom-right*,
   * *bottom-left*), or the *middle* of the frame. For example, for tips
   * distributed horizontally at the top of the frame:
   *
   * ```js
   * Plot.tip(data, {x: "date", frameAnchor: "top"})
   * ```
   */
  frameAnchor?: FrameAnchor | ParamRef;

  /**
   * The tip anchor specifies how to orient the tip box relative to its anchor
   * position; it refers to the part of the tip box that is attached to the
   * anchor point. For example, the *top-left* anchor places the top-left corner
   * of tip box near the anchor position, hence placing the tip box below and to
   * the right of the anchor position.
   */
  anchor?: FrameAnchor | ParamRef;

  /**
   * If an explicit tip anchor is not specified, an anchor is chosen
   * automatically such that the tip fits within the plot’s frame; if the
   * preferred anchor fits, it is chosen.
   */
  preferredAnchor?: FrameAnchor | null | ParamRef;

  /**
   * How channel values are formatted for display. If a format is a string, it
   * is interpreted as a (UTC) time format for temporal channels, and otherwise
   * a number format.
   */
  format?: {
    [name in ChannelName]?: boolean | string | ParamRef
  };

  /** The image filter for the tip’s box; defaults to a drop shadow. */
  pathFilter?: string | ParamRef;

  /** The size of the tip’s pointer in pixels; defaults to 12. */
  pointerSize?: number | ParamRef;

  /** The padding around the text in pixels; defaults to 8. */
  textPadding?: number | ParamRef;
}

/** How to interpolate between control points. */
export type Curve = CurveName;

/** Options for marks that support curves, such as lines and areas. */
export interface CurveOptions extends CurveAutoOptions {
  /**
   * The curve (interpolation) method for connecting adjacent points. One of:
   *
   * - *basis* - a cubic basis spline (repeating the end points)
   * - *basis-open* - an open cubic basis spline
   * - *basis-closed* - a closed cubic basis spline
   * - *bump-x* - a Bézier curve with horizontal tangents
   * - *bump-y* - a Bézier curve with vertical tangents
   * - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas)
   * - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends)
   * - *cardinal-open* - an open cubic cardinal spline
   * - *cardinal-closed* - an closed cubic cardinal spline
   * - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends)
   * - *catmull-rom-open* - an open cubic Catmull–Rom spline
   * - *catmull-rom-closed* - a closed cubic Catmull–Rom spline
   * - *linear* - a piecewise linear curve (*i.e.*, straight line segments)
   * - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments)
   * - *monotone-x* - a cubic spline that preserves monotonicity in *x*
   * - *monotone-y* - a cubic spline that preserves monotonicity in *y*
   * - *natural* - a natural cubic spline
   * - *step* - a piecewise constant function where *y* changes at the midpoint of *x*
   * - *step-after* - a piecewise constant function where *y* changes after *x*
   * - *step-before* - a piecewise constant function where *x* changes after *y*
   */
  curve?: Curve | ParamRef;
}

/** Options for marks that support possibly-projected curves. */
export interface CurveAutoOptions {
  /**
   * The curve (interpolation) method for connecting adjacent points. One of:
   *
   * - *basis* - a cubic basis spline (repeating the end points)
   * - *basis-open* - an open cubic basis spline
   * - *basis-closed* - a closed cubic basis spline
   * - *bump-x* - a Bézier curve with horizontal tangents
   * - *bump-y* - a Bézier curve with vertical tangents
   * - *bundle* - a straightened cubic basis spline (suitable for lines only, not areas)
   * - *cardinal* - a cubic cardinal spline (with one-sided differences at the ends)
   * - *cardinal-open* - an open cubic cardinal spline
   * - *cardinal-closed* - an closed cubic cardinal spline
   * - *catmull-rom* - a cubic Catmull–Rom spline (with one-sided differences at the ends)
   * - *catmull-rom-open* - an open cubic Catmull–Rom spline
   * - *catmull-rom-closed* - a closed cubic Catmull–Rom spline
   * - *linear* - a piecewise linear curve (*i.e.*, straight line segments)
   * - *linear-closed* - a closed piecewise linear curve (*i.e.*, straight line segments)
   * - *monotone-x* - a cubic spline that preserves monotonicity in *x*
   * - *monotone-y* - a cubic spline that preserves monotonicity in *y*
   * - *natural* - a natural cubic spline
   * - *step* - a piecewise constant function where *y* changes at the midpoint of *x*
   * - *step-after* - a piecewise constant function where *y* changes after *x*
   * - *step-before* - a piecewise constant function where *x* changes after *y*
   * - *auto* (default) - like *linear*, but use the (possibly spherical) projection, if any
   *
   * The *auto* curve is typically used in conjunction with a spherical
   * projection to interpolate along geodesics.
   */
  curve?: Curve | 'auto' | ParamRef;

  /**
   * The tension option only has an effect on bundle, cardinal and Catmull–Rom
   * splines (*bundle*, *cardinal*, *cardinal-open*, *cardinal-closed*,
   * *catmull-rom*, *catmull-rom-open*, and *catmull-rom-closed*). For bundle
   * splines, it corresponds to [beta][1]; for cardinal splines, [tension][2];
   * for Catmull–Rom splines, [alpha][3].
   *
   * [1]: https://d3js.org/d3-shape/curve#curveBundle_beta
   * [2]: https://d3js.org/d3-shape/curve#curveCardinal_tension
   * [3]: https://d3js.org/d3-shape/curve#curveCatmullRom_alpha
   */
  tension?: number | ParamRef;
}

/**
 * A built-in stack offset method; one of:
 *
 * - *normalize* - rescale each stack to fill [0, 1]
 * - *center* - align the centers of all stacks
 * - *wiggle* - translate stacks to minimize apparent movement
 *
 * If a given stack has zero total value, the *normalize* offset will not adjust
 * the stack’s position. Both the *center* and *wiggle* offsets ensure that the
 * lowest element across stacks starts at zero for better default axes. The
 * *wiggle* offset is recommended for streamgraphs in conjunction with the
 * *inside-out* order. For more, see [Byron & Wattenberg][1].
 *
 * [1]: https://leebyron.com/streamgraph/
 */
export type StackOffsetName =
  | 'center'
  | 'normalize'
  | 'wiggle';

/**
 * A stack offset method; one of:
 *
 * - *normalize* - rescale each stack to fill [0, 1]
 * - *center* - align the centers of all stacks
 * - *wiggle* - translate stacks to minimize apparent movement
 *
 * If a given stack has zero total value, the *normalize* offset will not adjust
 * the stack’s position. Both the *center* and *wiggle* offsets ensure that the
 * lowest element across stacks starts at zero for better default axes. The
 * *wiggle* offset is recommended for streamgraphs in conjunction with the
 * *inside-out* order. For more, see [Byron & Wattenberg][1].
 *
 * [1]: https://leebyron.com/streamgraph/
 */
export type StackOffset = StackOffsetName;

/**
 * The built-in stack order methods; one of:
 *
 * - *x* - alias of *value*; for stackX only
 * - *y* - alias of *value*; for stackY only
 * - *value* - ascending value (or descending with **reverse**)
 * - *sum* - total value per series
 * - *appearance* - position of maximum value per series
 * - *inside-out* (default with *wiggle*) - order the earliest-appearing series on the inside
 *
 * The *inside-out* order is recommended for streamgraphs in conjunction with
 * the *wiggle* offset. For more, see [Byron & Wattenberg][1].
 *
 * [1]: https://leebyron.com/streamgraph/
 */
export type StackOrderName = 'value' | 'x' | 'y' | 'z' | 'sum' | 'appearance' | 'inside-out';

/**
 * How to order layers prior to stacking; one of:
 *
 * - a named stack order method such as *inside-out* or *sum*
 * - a field name, for natural order of the corresponding values
 * - an array of explicit **z** values in the desired order
 */
export type StackOrder =
  | StackOrderName
  | `-${StackOrderName}`
  | (string & Record<never, never>)
  | any[];

/** Options for the stack transform. */
export interface StackOptions {
  /**
   * After stacking, an optional **offset** can be applied to translate and
   * scale stacks, say to produce a streamgraph; defaults to null for a zero
   * baseline (**y** = 0 for stackY, and **x** = 0 for stackX). If the *wiggle*
   * offset is used, the default **order** changes to *inside-out*.
   */
  offset?: StackOffset | null | ParamRef;

  /**
   * The order in which stacks are layered; one of:
   *
   * - null (default) for input order
   * - a named stack order method such as *inside-out* or *sum*
   * - a field name, for natural order of the corresponding values
   * - a function of data, for natural order of the corresponding values
   * - an array of explicit **z** values in the desired order
   *
   * If the *wiggle* **offset** is used, as for a streamgraph, the default
   * changes to *inside-out*.
   */
  order?: StackOrder | null | ParamRef;

  /** If true, reverse the effective order of the stacks. */
  reverse?: boolean | ParamRef;

  /**
   * The **z** channel defines the series of each value in the stack. Used when
   * the **order** is *sum*, *appearance*, *inside-out*, or an explicit array of
   * **z** values.
   */
  z?: ChannelValue;
}

/**
 * The built-in marker implementations; one of:
 *
 * - *arrow* - an arrowhead with *auto* orientation
 * - *arrow-reverse* - an arrowhead with *auto-start-reverse* orientation
 * - *dot* - a filled *circle* with no stroke and 2.5px radius
 * - *circle-fill* - a filled circle with a white stroke and 3px radius
 * - *circle-stroke* - a stroked circle with a white fill and 3px radius
 * - *circle* - alias for *circle-fill*
 * - *tick* - a small opposing line
 * - *tick-x* - a small horizontal line
 * - *tick-y* - a small vertical line
 */
export type MarkerName =
  | 'arrow'
  | 'arrow-reverse'
  | 'dot'
  | 'circle'
  | 'circle-fill'
  | 'circle-stroke'
  | 'tick'
  | 'tick-x'
  | 'tick-y';

/** Options for marks that support markers, such as lines and links. */
export interface MarkerOptions {
  /**
   * Shorthand to set the same default for markerStart, markerMid, and
   * markerEnd; one of:
   *
   * - a marker name such as *arrow* or *circle*
   * - *none* (default) - no marker
   * * true - alias for *circle-fill*
   * * false or null - alias for *none*
   */
  marker?: MarkerName | 'none' | boolean | null | ParamRef;

  /**
   * The marker for the starting point of a line segment; one of:
   *
   * - a marker name such as *arrow* or *circle*
   * * *none* (default) - no marker
   * * true - alias for *circle-fill*
   * * false or null - alias for *none*
   */
  markerStart?: MarkerName | 'none' | boolean | null | ParamRef;

  /**
   * The marker for any middle (interior) points of a line segment. If the line
   * segment only has a start and end point, this option has no effect. One of:
   *
   * - a marker name such as *arrow* or *circle*
   * * *none* (default) - no marker
   * * true - alias for *circle-fill*
   * * false or null - alias for *none*
   * * a function - a custom marker function; see below
   */
  markerMid?: MarkerName | 'none' | boolean | null | ParamRef;

  /**
   * The marker for the ending point of a line segment; one of:
   *
   * - a marker name such as *arrow* or *circle*
   * * *none* (default) - no marker
   * * true - alias for *circle-fill*
   * * false or null - alias for *none*
   */
  markerEnd?: MarkerName | 'none' | boolean | null | ParamRef;
}
