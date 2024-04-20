/**
 * A symbol indicating a fixed scale domain. A fixed domain is initially
 * determined from data as usual, but subsequently "fixed" so that it does not
 * change over subsequent interactive filtering, ensring stable comparisons.
 */
export type Fixed = 'Fixed';

// For internal use.
export type LiteralTimeInterval =
  | '3 months'
  | '10 years'
  | TimeIntervalName
  | (`${TimeIntervalName}s` & Record<never, never>)
  | (`${number} ${TimeIntervalName}` & Record<never, never>)
  | (`${number} ${TimeIntervalName}s` & Record<never, never>);

/**
 * The built-in time intervals; UTC or local time, depending on context. The
 * *week* interval is an alias for *sunday*. The *quarter* interval is every
 * three months, and the *half* interval is every six months, aligned at the
 * start of the year.
 */
export type TimeIntervalName =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter' // 3 months
  | 'half' // 6 months
  | 'year'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

/**
 * How to partition a continuous range into discrete intervals; one of:
 *
 * - a named time interval such as *day* (for date intervals)
 * - a number (for number intervals), defining intervals at integer multiples of *n*
 */
export type Interval<T = any> = T extends Date ? LiteralTimeInterval
  : T extends number ? number
  : never;

/**
 * The built-in scale names; one of:
 *
 * - *x* - horizontal position
 * - *y* - vertical position
 * - *fx* - horizontal facet position
 * - *fy* - vertical facet position
 * - *r* - radius (for dots and point geos)
 * - *color* - color
 * - *opacity* - opacity
 * - *symbol* - categorical symbol (for dots)
 * - *length* - length (for vectors)
 *
 * Position scales may have associated axes. Color, opacity, and symbol scales
 * may have an associated legend.
 */
export type ScaleName = 'x' | 'y' | 'fx' | 'fy' | 'r' | 'color' | 'opacity' | 'symbol' | 'length';

/**
 * The supported scale types for *x* and *y* position encodings.
 *
 * For quantitative data, one of:
 *
 * - *linear* (default) - linear transform (translate and scale)
 * - *pow* - power (exponential) transform
 * - *sqrt* - square-root transform; *pow* with *exponent* = 0.5
 * - *log* - logarithmic transform
 * - *symlog* - bi-symmetric logarithmic transform per Webber et al.
 *
 * For temporal data, one of:
 *
 * - *utc* (default, recommended) - UTC time
 * - *time* - local time
 *
 * For ordinal data, one of:
 *
 * - *point* (for position only) - divide a continuous range into discrete points
 * - *band* (for position only) - divide a continuous range into discrete points
 *
 * Other scale types:
 *
 * - *identity* - do not transform values when encoding
 */
export type PositionScaleType =
  | 'linear'
  | 'pow'
  | 'sqrt'
  | 'log'
  | 'symlog'
  | 'utc'
  | 'time'
  | 'point'
  | 'band'
  | 'threshold'
  | 'quantile'
  | 'quantize'
  | 'identity';

/**
 * The supported scale types for *color* encodings.
 *
 * For quantitative data, one of:
 *
 * - *linear* (default) - linear transform (translate and scale)
 * - *pow* - power (exponential) transform
 * - *sqrt* - square-root transform; *pow* with *exponent* = 0.5
 * - *log* - logarithmic transform
 * - *symlog* - bi-symmetric logarithmic transform per Webber et al.
 *
 * For temporal data, one of:
 *
 * - *utc* (default, recommended) - UTC time
 * - *time* - local time
 *
 * For ordinal data, one of:
 *
 * - *ordinal* - from discrete inputs to discrete outputs
 *
 * For color, one of:
 *
 * - *categorical* - equivalent to *ordinal*; defaults to *observable10*
 * - *sequential* - equivalent to *linear*; defaults to *turbo*
 * - *cyclical* - equivalent to *linear*; defaults to *rainbow*
 * - *threshold* - encodes using discrete thresholds; defaults to *rdylbu*
 * - *quantile* - encodes using quantile thresholds; defaults to *rdylbu*
 * - *quantize* - uniformly quantizes a continuous domain; defaults to *rdylbu*
 * - *diverging* - *linear*, but with a pivot; defaults to *rdbu*
 * - *diverging-log* - *log*, but with a pivot; defaults to *rdbu*
 * - *diverging-pow* - *pow*, but with a pivot; defaults to *rdbu*
 * - *diverging-sqrt* - *sqrt*, but with a pivot; defaults to *rdbu*
 * - *diverging-symlog* - *symlog*, but with a pivot; defaults to *rdbu*
 *
 * Other scale types:
 *
 * - *identity* - do not transform values when encoding
 */
export type ColorScaleType =
  | 'linear'
  | 'pow'
  | 'sqrt'
  | 'log'
  | 'symlog'
  | 'utc'
  | 'time'
  | 'point'
  | 'band'
  | 'ordinal'
  | 'sequential'
  | 'cyclical'
  | 'diverging'
  | 'diverging-log'
  | 'diverging-pow'
  | 'diverging-sqrt'
  | 'diverging-symlog'
  | 'categorical'
  | 'threshold'
  | 'quantile'
  | 'quantize'
  | 'identity';

/**
 * The supported scale types for continuous encoding channels.
 *
 * For quantitative data, one of:
 *
 * - *linear* (default) - linear transform (translate and scale)
 * - *pow* - power (exponential) transform
 * - *sqrt* - square-root transform; *pow* with *exponent* = 0.5
 * - *log* - logarithmic transform
 * - *symlog* - bi-symmetric logarithmic transform per Webber et al.
 *
 * For temporal data, one of:
 *
 * - *utc* (default, recommended) - UTC time
 * - *time* - local time
 *
 * Other scale types:
 *
 * - *identity* - do not transform values when encoding
 */
export type ContinuousScaleType =
  | 'linear'
  | 'pow'
  | 'sqrt'
  | 'log'
  | 'symlog'
  | 'utc'
  | 'time'
  | 'identity';

/**
 * The supported scale types for discrete encoding channels. One of:
 *
 * - *ordinal* - from discrete inputs to discrete outputs
 * - *identity* - do not transform values when encoding
 */
export type DiscreteScaleType =
  | 'ordinal'
  | 'identity';

/**
 * The built-in projection implementations; one of:
 *
 * - *albers-usa* - a U.S.-centric composite projection with insets for Alaska and Hawaii
 * - *albers* - a U.S.-centric *conic-equal-area* projection
 * - *azimuthal-equal-area* - the azimuthal equal-area projection
 * - *azimuthal-equidistant* - the azimuthal equidistant projection
 * - *conic-conformal* - the conic conformal projection
 * - *conic-equal-area* - the conic equal-area projection
 * - *conic-equidistant* - the conic equidistant projection
 * - *equal-earth* - the Equal Earth projection Šavrič et al., 2018
 * - *equirectangular* - the equirectangular (plate carrée) projection
 * - *gnomonic* - the gnomonic projection
 * - *identity* - the identity projection
 * - *reflect-y* - the identity projection, but flipping *y*
 * - *mercator* - the spherical Mercator projection
 * - *orthographic* - the orthographic projection
 * - *stereographic* - the stereographic projection
 * - *transverse-mercator* - the transverse spherical Mercator projection
 */
export type ProjectionName =
  | 'albers-usa'
  | 'albers'
  | 'azimuthal-equal-area'
  | 'azimuthal-equidistant'
  | 'conic-conformal'
  | 'conic-equal-area'
  | 'conic-equidistant'
  | 'equal-earth'
  | 'equirectangular'
  | 'gnomonic'
  | 'identity'
  | 'reflect-y'
  | 'mercator'
  | 'orthographic'
  | 'stereographic'
  | 'transverse-mercator';

/**
 * How to interpolate range (output) values for continuous scales; one of:
 *
 * - *number* - linear numeric interpolation
 * - *rgb* - red, green, blue (sRGB)
 * - *hsl* - hue, saturation, lightness (HSL; cylindrical sRGB)
 * - *hcl* - hue, chroma, perceptual lightness (CIELCh_ab; cylindrical CIELAB)
 * - *lab* - perceptual lightness and opponent colors (L\*a\*b\*, CIELAB)
 */
export type Interpolate =
  | 'number'
  | 'rgb'
  | 'hsl'
  | 'hcl'
  | 'lab';

/** The built-in color schemes, cased. */
type ColorSchemeCase =
  | 'Accent'
  | 'Category10'
  | 'Dark2'
  | 'Observable10'
  | 'Paired'
  | 'Pastel1'
  | 'Pastel2'
  | 'Set1'
  | 'Set2'
  | 'Set3'
  | 'Tableau10'
  | 'BrBG'
  | 'PRGn'
  | 'PiYG'
  | 'PuOr'
  | 'RdBu'
  | 'RdGy'
  | 'RdYlBu'
  | 'RdYlGn'
  | 'Spectral'
  | 'BuRd'
  | 'BuYlRd'
  | 'Blues'
  | 'Greens'
  | 'Greys'
  | 'Oranges'
  | 'Purples'
  | 'Reds'
  | 'Turbo'
  | 'Viridis'
  | 'Magma'
  | 'Inferno'
  | 'Plasma'
  | 'Cividis'
  | 'Cubehelix'
  | 'Warm'
  | 'Cool'
  | 'BuGn'
  | 'BuPu'
  | 'GnBu'
  | 'OrRd'
  | 'PuBu'
  | 'PuBuGn'
  | 'PuRd'
  | 'RdPu'
  | 'YlGn'
  | 'YlGnBu'
  | 'YlOrBr'
  | 'YlOrRd'
  | 'Rainbow'
  | 'Sinebow';

/**
 * The built-in color schemes. For categorical data, one of:
 *
 * - *Accent* - eight colors
 * - *Category10* - ten colors
 * - *Dark2* - eight colors
 * - *Observable10* (default) - ten colors
 * - *Paired* - twelve paired colors
 * - *Pastel1* - nine colors
 * - *Pastel2* - eight colors
 * - *Set1* - nine colors
 * - *Set2* - eight colors
 * - *Set3* - twelve colors
 * - *Tableau10* - ten colors
 *
 * For diverging data, one of:
 *
 * - *BrBG* - from brown to white to blue-green
 * - *PRGn* - from purple to white to green
 * - *PiYG* - from pink to white to yellow-green
 * - *PuOr* - from purple to white to orange
 * - *RdBu* (default) - from red to white to blue
 * - *RdGy* - from red to white to gray
 * - *RdYlBu* - from red to yellow to blue
 * - *RdYlGn* - from red to yellow to green
 * - *Spectral* - from red to blue, through the spectrum
 * - *BuRd* - from blue to white to red
 * - *BuYlRd* - from blue to yellow to red
 *
 * For sequential data, one of:
 *
 * - *Blues* - from white to blue
 * - *Greens* - from white to green
 * - *Greys* - from white to gray
 * - *Oranges* - from white to orange
 * - *Purples* - from white to purple
 * - *Reds* - from white to red
 * - *Turbo* (default) - from blue to red, through the spectrum
 * - *Viridis* - from blue to green to yellow
 * - *Magma* - from purple to orange to yellow
 * - *Inferno* - from purple to orange to yellow
 * - *Plasma* - from purple to orange to yellow
 * - *Cividis* - from blue to yellow
 * - *Cubehelix* - from black to white, rotating hue
 * - *Warm* - from purple to green, through warm hues
 * - *Cool* - from green to to purple, through cool hues
 * - *BuGn* - from light blue to dark green
 * - *BuPu* - from light blue to dark purple
 * - *GnBu* - from light green to dark blue
 * - *OrRd* - from light orange to dark red
 * - *PuBu* - from light purple to dark blue
 * - *PuBuGn* - from light purple to blue to dark green
 * - *PuRd* - from light purple to dark red
 * - *RdPu* - from light red to dark purple
 * - *YlGn* - from light yellow to dark green
 * - *YlGnBu* - from light yellow to green to dark blue
 * - *YlOrBr* - from light yellow to orange to dark brown
 * - *YlOrRd* - from light yellow to orange to dark red
 *
 * For cyclical data, one of:
 *
 * - *Rainbow* (default) - the less-angry rainbow color scheme
 * - *Sinebow* - Bumgardner and Loyd’s “sinebow” scheme
 */
export type ColorScheme = ColorSchemeCase | (Lowercase<ColorSchemeCase> & Record<never, never>);

/**
 * The built-in symbol implementations. For fill, one of:
 *
 * - *circle* - a circle
 * - *cross* - a Greek cross with arms of equal length
 * - *diamond* - a rhombus
 * - *square* - a square
 * - *star* - a pentagonal star (pentagram)
 * - *triangle* - an up-pointing triangle
 * - *wye* - a Y with arms of equal length
 *
 * For stroke (based on [Heman Robinson’s research][1]), one of:
 *
 * - *circle* - a circle
 * - *plus* - a plus sign
 * - *times* - an X with arms of equal length
 * - *triangle2* - an (alternate) up-pointing triangle
 * - *asterisk* - an asterisk
 * - *square2* - a (alternate) square
 * - *diamond2* - a rotated square
 *
 * The *hexagon* symbol is also supported.
 *
 * [1]: https://www.tandfonline.com/doi/abs/10.1080/10618600.2019.1637746
 */
export type SymbolType =
  | 'asterisk'
  | 'circle'
  | 'cross'
  | 'diamond'
  | 'diamond2'
  | 'hexagon'
  | 'plus'
  | 'square'
  | 'square2'
  | 'star'
  | 'times'
  | 'triangle'
  | 'triangle2'
  | 'wye';

/**
 * How to anchor a mark relative to the plot’s frame; one of:
 *
 * - *middle* - centered in the middle
 * - in the middle of one of the edges: *top*, *right*, *bottom*, *left*
 * - in one of the corners: *top-left*, *top-right*, *bottom-right*, *bottom-left*
 */
export type FrameAnchor =
  | 'middle'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

// from https://github.com/observablehq/plot/blob/main/src/reducer.d.ts
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// For internal use.
export type ReducerPercentile =
  | (`p${Digit}${Digit}` & Record<never, never>) // see https://github.com/microsoft/TypeScript/issues/29729
  | 'p25'
  | 'p50'
  | 'p75';

/**
 * How to reduce aggregated (binned or grouped) values; one of:
 *
 * - *first* - the first value, in input order
 * - *last* - the last value, in input order
 * - *count* - the number of elements (frequency)
 * - *distinct* - the number of distinct values
 * - *sum* - the sum of values
 * - *proportion* - the sum proportional to the overall total (weighted frequency)
 * - *proportion-facet* - the sum proportional to the facet total
 * - *deviation* - the standard deviation
 * - *min* - the minimum value
 * - *min-index* - the zero-based index of the minimum value
 * - *max* - the maximum value
 * - *max-index* - the zero-based index of the maximum value
 * - *mean* - the mean value (average)
 * - *median* - the median value
 * - *variance* - the variance per [Welford’s algorithm][1]
 * - *mode* - the value with the most occurrences
 * - *pXX* - the percentile value, where XX is a number in [00,99]
 * - *identity* - the array of values
 *
 * [1]: https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm
 */
export type Reducer =
  | 'first'
  | 'last'
  | 'identity'
  | 'count'
  | 'distinct'
  | 'sum'
  | 'proportion'
  | 'proportion-facet'
  | 'deviation'
  | 'min'
  | 'min-index'
  | 'max'
  | 'max-index'
  | 'mean'
  | 'median'
  | 'variance'
  | 'mode'
  | ReducerPercentile;

/** The built-in curve implementations. */
export type CurveName =
  | 'basis'
  | 'basis-closed'
  | 'basis-open'
  | 'bundle'
  | 'bump-x'
  | 'bump-y'
  | 'cardinal'
  | 'cardinal-closed'
  | 'cardinal-open'
  | 'catmull-rom'
  | 'catmull-rom-closed'
  | 'catmull-rom-open'
  | 'linear'
  | 'linear-closed'
  | 'monotone-x'
  | 'monotone-y'
  | 'natural'
  | 'step'
  | 'step-after'
  | 'step-before';
