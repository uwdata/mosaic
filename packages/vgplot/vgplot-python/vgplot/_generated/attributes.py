# DO NOT EDIT. Generated from the Mosaic JSON schema by bin/generate-python-api.js.
# Regenerate with: pnpm run generate:python-api

from .._types import AttrValue
from ..plot import Directive


def align(value: AttrValue) -> Directive:
    """How to distribute unused space in the **range** for *point* and *band* scales."""
    return Directive("align", value)


def aria_description(value: AttrValue) -> Directive:
    """The aria-description attribute on the SVG root."""
    return Directive("ariaDescription", value)


def aria_label(value: AttrValue) -> Directive:
    """The aria-label attribute on the SVG root."""
    return Directive("ariaLabel", value)


def aspect_ratio(value: AttrValue = True) -> Directive:
    """The desired aspect ratio of the *x* and *y* scales, affecting the default height."""
    return Directive("aspectRatio", value)


def axis(value: AttrValue = True) -> Directive:
    """The side of the frame on which to place the implicit axis: *top* or *bottom* for *x* or *fx*, or *left* or *right* for *y* or *fy*."""
    return Directive("axis", value)


def clip(value: AttrValue = True) -> Directive:
    """The default clip for all marks."""
    return Directive("clip", value)


def color_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("colorBase", value)


def color_clamp(value: AttrValue = True) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("colorClamp", value)


def color_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("colorConstant", value)


def color_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("colorDomain", value)


def color_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("colorExponent", value)


def color_interpolate(value: AttrValue) -> Directive:
    """How to interpolate color range values."""
    return Directive("colorInterpolate", value)


def color_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("colorLabel", value)


def color_n(value: AttrValue) -> Directive:
    """For a *quantile* scale, the number of quantiles (creates *n* - 1 thresholds); for a *quantize* scale, the approximate number of thresholds; defaults to 5."""
    return Directive("colorN", value)


def color_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("colorNice", value)


def color_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("colorPercent", value)


def color_pivot(value: AttrValue) -> Directive:
    """For a diverging color scale, the input value (abstract value) that divides the domain into two parts; defaults to 0 for *diverging* scales, dividing the domain into negative and positive parts; defaults to 1 for *diverging-log* scales."""
    return Directive("colorPivot", value)


def color_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("colorRange", value)


def color_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("colorReverse", value)


def color_scale(value: AttrValue) -> Directive:
    """The *color* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("colorScale", value)


def color_scheme(value: AttrValue) -> Directive:
    """If specified, shorthand for setting the **colorRange** or **colorInterpolate** option of a *color* scale."""
    return Directive("colorScheme", value)


def color_symmetric(value: AttrValue = True) -> Directive:
    """For a diverging color scale, if true (the default), extend the domain to ensure that the lower part of the domain (below the **pivot**) is commensurate with the upper part of the domain (above the **pivot**)."""
    return Directive("colorSymmetric", value)


def color_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("colorTickFormat", value)


def color_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("colorZero", value)


def facet_grid(value: AttrValue = True) -> Directive:
    """Default axis grid for fx and fy scales; typically set to true to enable."""
    return Directive("facetGrid", value)


def facet_label(value: AttrValue) -> Directive:
    """Default axis label for fx and fy scales; typically set to null to disable."""
    return Directive("facetLabel", value)


def facet_margin(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four facet margins: marginTop, marginRight, marginBottom, and marginLeft."""
    return Directive("facetMargin", value)


def facet_margin_bottom(value: AttrValue) -> Directive:
    """The right facet margin; the (minimum) distance in pixels between the right edges of the inner and outer plot area."""
    return Directive("facetMarginBottom", value)


def facet_margin_left(value: AttrValue) -> Directive:
    """The bottom facet margin; the (minimum) distance in pixels between the bottom edges of the inner and outer plot area."""
    return Directive("facetMarginLeft", value)


def facet_margin_right(value: AttrValue) -> Directive:
    """The left facet margin; the (minimum) distance in pixels between the left edges of the inner and outer plot area."""
    return Directive("facetMarginRight", value)


def facet_margin_top(value: AttrValue) -> Directive:
    """The top facet margin; the (minimum) distance in pixels between the top edges of the inner and outer plot area."""
    return Directive("facetMarginTop", value)


def fx_align(value: AttrValue) -> Directive:
    """How to distribute unused space in the **range** for *point* and *band* scales."""
    return Directive("fxAlign", value)


def fx_aria_description(value: AttrValue) -> Directive:
    """A textual description for the axis in the accessibility tree."""
    return Directive("fxAriaDescription", value)


def fx_aria_label(value: AttrValue) -> Directive:
    """A short label representing the axis in the accessibility tree."""
    return Directive("fxAriaLabel", value)


def fx_axis(value: AttrValue = True) -> Directive:
    """The side of the frame on which to place the implicit axis: *top* or *bottom* for *fx*."""
    return Directive("fxAxis", value)


def fx_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("fxDomain", value)


def fx_font_variant(value: AttrValue) -> Directive:
    """The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."""
    return Directive("fxFontVariant", value)


def fx_grid(value: AttrValue = True) -> Directive:
    """Whether to show a grid aligned with the scale’s ticks."""
    return Directive("fxGrid", value)


def fx_inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**."""
    return Directive("fxInset", value)


def fx_inset_left(value: AttrValue) -> Directive:
    """Insets the left edge by the specified number of pixels."""
    return Directive("fxInsetLeft", value)


def fx_inset_right(value: AttrValue) -> Directive:
    """Insets the right edge by the specified number of pixels."""
    return Directive("fxInsetRight", value)


def fx_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("fxLabel", value)


def fx_label_anchor(value: AttrValue) -> Directive:
    """Where to place the axis **label** relative to the plot’s frame."""
    return Directive("fxLabelAnchor", value)


def fx_label_offset(value: AttrValue) -> Directive:
    """The axis **label** position offset (in pixels); default depends on margins and orientation."""
    return Directive("fxLabelOffset", value)


def fx_line(value: AttrValue = True) -> Directive:
    """If true, draw a line along the axis; if false (default), do not."""
    return Directive("fxLine", value)


def fx_padding(value: AttrValue) -> Directive:
    """For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%)."""
    return Directive("fxPadding", value)


def fx_padding_inner(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to separate adjacent bands."""
    return Directive("fxPaddingInner", value)


def fx_padding_outer(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to inset first and last bands."""
    return Directive("fxPaddingOuter", value)


def fx_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("fxRange", value)


def fx_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("fxReverse", value)


def fx_round(value: AttrValue = True) -> Directive:
    """If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering."""
    return Directive("fxRound", value)


def fx_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("fxTickFormat", value)


def fx_tick_padding(value: AttrValue) -> Directive:
    """The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fxTickSize** and **fxTickRotate**."""
    return Directive("fxTickPadding", value)


def fx_tick_rotate(value: AttrValue) -> Directive:
    """The rotation angle of axis tick labels in degrees clocksize; defaults to 0."""
    return Directive("fxTickRotate", value)


def fx_ticks(value: AttrValue) -> Directive:
    """The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."""
    return Directive("fxTicks", value)


def fx_tick_size(value: AttrValue) -> Directive:
    """The length of axis tick marks in pixels; negative values extend in the opposite direction."""
    return Directive("fxTickSize", value)


def fx_tick_spacing(value: AttrValue) -> Directive:
    """The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."""
    return Directive("fxTickSpacing", value)


def fy_align(value: AttrValue) -> Directive:
    """How to distribute unused space in the **range** for *point* and *band* scales."""
    return Directive("fyAlign", value)


def fy_aria_description(value: AttrValue) -> Directive:
    """A textual description for the axis in the accessibility tree."""
    return Directive("fyAriaDescription", value)


def fy_aria_label(value: AttrValue) -> Directive:
    """A short label representing the axis in the accessibility tree."""
    return Directive("fyAriaLabel", value)


def fy_axis(value: AttrValue = True) -> Directive:
    """The side of the frame on which to place the implicit axis: *left* or *right* for *fy*."""
    return Directive("fyAxis", value)


def fy_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("fyDomain", value)


def fy_font_variant(value: AttrValue) -> Directive:
    """The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."""
    return Directive("fyFontVariant", value)


def fy_grid(value: AttrValue = True) -> Directive:
    """Whether to show a grid aligned with the scale’s ticks."""
    return Directive("fyGrid", value)


def fy_inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**."""
    return Directive("fyInset", value)


def fy_inset_bottom(value: AttrValue) -> Directive:
    """Insets the bottom edge by the specified number of pixels."""
    return Directive("fyInsetBottom", value)


def fy_inset_top(value: AttrValue) -> Directive:
    """Insets the top edge by the specified number of pixels."""
    return Directive("fyInsetTop", value)


def fy_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("fyLabel", value)


def fy_label_anchor(value: AttrValue) -> Directive:
    """Where to place the axis **label** relative to the plot’s frame."""
    return Directive("fyLabelAnchor", value)


def fy_label_offset(value: AttrValue) -> Directive:
    """The axis **label** position offset (in pixels); default depends on margins and orientation."""
    return Directive("fyLabelOffset", value)


def fy_line(value: AttrValue = True) -> Directive:
    """If true, draw a line along the axis; if false (default), do not."""
    return Directive("fyLine", value)


def fy_padding(value: AttrValue) -> Directive:
    """For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%)."""
    return Directive("fyPadding", value)


def fy_padding_inner(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to separate adjacent bands."""
    return Directive("fyPaddingInner", value)


def fy_padding_outer(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to inset first and last bands."""
    return Directive("fyPaddingOuter", value)


def fy_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("fyRange", value)


def fy_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("fyReverse", value)


def fy_round(value: AttrValue = True) -> Directive:
    """If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering."""
    return Directive("fyRound", value)


def fy_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("fyTickFormat", value)


def fy_tick_padding(value: AttrValue) -> Directive:
    """The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **fyTickSize** and **fyTickRotate**."""
    return Directive("fyTickPadding", value)


def fy_tick_rotate(value: AttrValue) -> Directive:
    """The rotation angle of axis tick labels in degrees clocksize; defaults to 0."""
    return Directive("fyTickRotate", value)


def fy_ticks(value: AttrValue) -> Directive:
    """The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."""
    return Directive("fyTicks", value)


def fy_tick_size(value: AttrValue) -> Directive:
    """The length of axis tick marks in pixels; negative values extend in the opposite direction."""
    return Directive("fyTickSize", value)


def fy_tick_spacing(value: AttrValue) -> Directive:
    """The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."""
    return Directive("fyTickSpacing", value)


def grid(value: AttrValue = True) -> Directive:
    """Whether to show a grid aligned with the scale’s ticks."""
    return Directive("grid", value)


def height(value: AttrValue) -> Directive:
    """The outer height of the plot in pixels, including margins."""
    return Directive("height", value)


def inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**."""
    return Directive("inset", value)


def length_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("lengthBase", value)


def length_clamp(value: AttrValue) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("lengthClamp", value)


def length_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("lengthConstant", value)


def length_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("lengthDomain", value)


def length_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("lengthExponent", value)


def length_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("lengthNice", value)


def length_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("lengthPercent", value)


def length_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("lengthRange", value)


def length_scale(value: AttrValue) -> Directive:
    """The *length* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("lengthScale", value)


def length_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("lengthZero", value)


def margin(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four margins: **marginTop**, **marginRight**, **marginBottom**, and **marginLeft**."""
    return Directive("margin", value)


def margin_bottom(value: AttrValue) -> Directive:
    """The bottom margin; the distance in pixels between the bottom edges of the inner and outer plot area."""
    return Directive("marginBottom", value)


def margin_left(value: AttrValue) -> Directive:
    """The left margin; the distance in pixels between the left edges of the inner and outer plot area."""
    return Directive("marginLeft", value)


def margin_right(value: AttrValue) -> Directive:
    """The right margin; the distance in pixels between the right edges of the inner and outer plot area."""
    return Directive("marginRight", value)


def margin_top(value: AttrValue) -> Directive:
    """The top margin; the distance in pixels between the top edges of the inner and outer plot area."""
    return Directive("marginTop", value)


def name(value: AttrValue) -> Directive:
    """A unique name for the plot."""
    return Directive("name", value)


def opacity_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("opacityBase", value)


def opacity_clamp(value: AttrValue = True) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("opacityClamp", value)


def opacity_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("opacityConstant", value)


def opacity_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("opacityDomain", value)


def opacity_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("opacityExponent", value)


def opacity_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("opacityLabel", value)


def opacity_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("opacityNice", value)


def opacity_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("opacityPercent", value)


def opacity_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("opacityRange", value)


def opacity_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("opacityReverse", value)


def opacity_scale(value: AttrValue) -> Directive:
    """The *opacity* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("opacityScale", value)


def opacity_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("opacityTickFormat", value)


def opacity_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("opacityZero", value)


def padding(value: AttrValue) -> Directive:
    """For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%)."""
    return Directive("padding", value)


def projection_clip(value: AttrValue = True) -> Directive:
    """The projection’s clipping method; one of: - *frame* or true (default) - clip to the plot’s frame (including margins but not insets) - a number - clip to a circle of the given radius in degrees centered around the origin - null or false - do not clip Some projections (such as *armadillo* and *berghaus*) require spherical clipping: in that case set the marks’ **clip** option to *sphere*."""
    return Directive("projectionClip", value)


def projection_domain(value: AttrValue) -> Directive:
    """A GeoJSON object to fit to the plot’s frame (minus insets); defaults to a Sphere for spherical projections (outline of the the whole globe)."""
    return Directive("projectionDomain", value)


def projection_inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four projection insets."""
    return Directive("projectionInset", value)


def projection_inset_bottom(value: AttrValue) -> Directive:
    """Insets the bottom edge of the projection by the specified number of pixels."""
    return Directive("projectionInsetBottom", value)


def projection_inset_left(value: AttrValue) -> Directive:
    """Insets the left edge of the projection by the specified number of pixels."""
    return Directive("projectionInsetLeft", value)


def projection_inset_right(value: AttrValue) -> Directive:
    """Insets the right edge of the projection by the specified number of pixels."""
    return Directive("projectionInsetRight", value)


def projection_inset_top(value: AttrValue) -> Directive:
    """Insets the top edge of the projection by the specified number of pixels."""
    return Directive("projectionInsetTop", value)


def projection_parallels(value: AttrValue) -> Directive:
    """The standard parallels."""
    return Directive("projectionParallels", value)


def projection_precision(value: AttrValue) -> Directive:
    """The projection’s sampling threshold."""
    return Directive("projectionPrecision", value)


def projection_rotate(value: AttrValue) -> Directive:
    """A rotation of the sphere before projection; defaults to 0, 0, 0."""
    return Directive("projectionRotate", value)


def projection_type(value: AttrValue) -> Directive:
    """The desired projection; one of: - a named built-in projection such as *albers-usa* - null, for no projection Named projections are scaled and translated to fit the **domain** to the plot’s frame (minus insets)."""
    return Directive("projectionType", value)


def r_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("rBase", value)


def r_clamp(value: AttrValue) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("rClamp", value)


def r_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("rConstant", value)


def r_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("rDomain", value)


def r_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("rExponent", value)


def r_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("rLabel", value)


def r_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("rNice", value)


def r_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("rPercent", value)


def r_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("rRange", value)


def r_scale(value: AttrValue) -> Directive:
    """The *r* (radius) scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("rScale", value)


def r_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("rZero", value)


def style(value: AttrValue) -> Directive:
    """Custom styles to override Plot’s defaults."""
    return Directive("style", value)


def symbol_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("symbolDomain", value)


def symbol_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("symbolRange", value)


def symbol_scale(value: AttrValue) -> Directive:
    """The *symbol* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("symbolScale", value)


def width(value: AttrValue) -> Directive:
    """The outer width of the plot in pixels, including margins."""
    return Directive("width", value)


def x_align(value: AttrValue) -> Directive:
    """How to distribute unused space in the **range** for *point* and *band* scales."""
    return Directive("xAlign", value)


def x_aria_description(value: AttrValue) -> Directive:
    """A textual description for the axis in the accessibility tree."""
    return Directive("xAriaDescription", value)


def x_aria_label(value: AttrValue) -> Directive:
    """A short label representing the axis in the accessibility tree."""
    return Directive("xAriaLabel", value)


def x_axis(value: AttrValue = True) -> Directive:
    """The side of the frame on which to place the implicit axis: *top* or *bottom* for *x*."""
    return Directive("xAxis", value)


def x_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("xBase", value)


def x_clamp(value: AttrValue = True) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("xClamp", value)


def x_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("xConstant", value)


def x_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("xDomain", value)


def x_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("xExponent", value)


def x_font_variant(value: AttrValue) -> Directive:
    """The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."""
    return Directive("xFontVariant", value)


def x_grid(value: AttrValue = True) -> Directive:
    """Whether to show a grid aligned with the scale’s ticks."""
    return Directive("xGrid", value)


def x_inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**."""
    return Directive("xInset", value)


def x_inset_left(value: AttrValue) -> Directive:
    """Insets the left edge by the specified number of pixels."""
    return Directive("xInsetLeft", value)


def x_inset_right(value: AttrValue) -> Directive:
    """Insets the right edge by the specified number of pixels."""
    return Directive("xInsetRight", value)


def x_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("xLabel", value)


def x_label_anchor(value: AttrValue) -> Directive:
    """Where to place the axis **label** relative to the plot’s frame."""
    return Directive("xLabelAnchor", value)


def x_label_arrow(value: AttrValue) -> Directive:
    """Whether to apply a directional arrow such as → or ↑ to the x-axis scale label."""
    return Directive("xLabelArrow", value)


def x_label_offset(value: AttrValue) -> Directive:
    """The axis **label** position offset (in pixels); default depends on margins and orientation."""
    return Directive("xLabelOffset", value)


def x_line(value: AttrValue = True) -> Directive:
    """If true, draw a line along the axis; if false (default), do not."""
    return Directive("xLine", value)


def x_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("xNice", value)


def x_padding(value: AttrValue) -> Directive:
    """For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%)."""
    return Directive("xPadding", value)


def x_padding_inner(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to separate adjacent bands."""
    return Directive("xPaddingInner", value)


def x_padding_outer(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to inset first and last bands."""
    return Directive("xPaddingOuter", value)


def x_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("xPercent", value)


def x_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("xRange", value)


def x_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("xReverse", value)


def x_round(value: AttrValue = True) -> Directive:
    """If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering."""
    return Directive("xRound", value)


def x_scale(value: AttrValue) -> Directive:
    """The *x* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("xScale", value)


def x_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("xTickFormat", value)


def x_tick_padding(value: AttrValue) -> Directive:
    """The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **xTickSize** and **xTickRotate**."""
    return Directive("xTickPadding", value)


def x_tick_rotate(value: AttrValue) -> Directive:
    """The rotation angle of axis tick labels in degrees clocksize; defaults to 0."""
    return Directive("xTickRotate", value)


def x_ticks(value: AttrValue) -> Directive:
    """The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."""
    return Directive("xTicks", value)


def x_tick_size(value: AttrValue) -> Directive:
    """The length of axis tick marks in pixels; negative values extend in the opposite direction."""
    return Directive("xTickSize", value)


def x_tick_spacing(value: AttrValue) -> Directive:
    """The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."""
    return Directive("xTickSpacing", value)


def xy_domain(value: AttrValue) -> Directive:
    """Set the *x* and *y* scale domains."""
    return Directive("xyDomain", value)


def x_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("xZero", value)


def y_align(value: AttrValue) -> Directive:
    """How to distribute unused space in the **range** for *point* and *band* scales."""
    return Directive("yAlign", value)


def y_aria_description(value: AttrValue) -> Directive:
    """A textual description for the axis in the accessibility tree."""
    return Directive("yAriaDescription", value)


def y_aria_label(value: AttrValue) -> Directive:
    """A short label representing the axis in the accessibility tree."""
    return Directive("yAriaLabel", value)


def y_axis(value: AttrValue = True) -> Directive:
    """The side of the frame on which to place the implicit axis: *left* or *right* for *y*."""
    return Directive("yAxis", value)


def y_base(value: AttrValue) -> Directive:
    """A log scale’s base; defaults to 10."""
    return Directive("yBase", value)


def y_clamp(value: AttrValue = True) -> Directive:
    """If true, values below the domain minimum are treated as the domain minimum, and values above the domain maximum are treated as the domain maximum."""
    return Directive("yClamp", value)


def y_constant(value: AttrValue) -> Directive:
    """A symlog scale’s constant, expressing the magnitude of the linear region around the origin; defaults to 1."""
    return Directive("yConstant", value)


def y_domain(value: AttrValue) -> Directive:
    """The extent of the scale’s inputs (abstract values)."""
    return Directive("yDomain", value)


def y_exponent(value: AttrValue) -> Directive:
    """A power scale’s exponent (*e.g.*, 0.5 for sqrt); defaults to 1 for a linear scale."""
    return Directive("yExponent", value)


def y_font_variant(value: AttrValue) -> Directive:
    """The font-variant attribute for axis ticks; defaults to *tabular-nums* for quantitative axes."""
    return Directive("yFontVariant", value)


def y_grid(value: AttrValue = True) -> Directive:
    """Whether to show a grid aligned with the scale’s ticks."""
    return Directive("yGrid", value)


def y_inset(value: AttrValue) -> Directive:
    """Shorthand to set the same default for all four insets: **insetTop**, **insetRight**, **insetBottom**, and **insetLeft**."""
    return Directive("yInset", value)


def y_inset_bottom(value: AttrValue) -> Directive:
    """Insets the bottom edge by the specified number of pixels."""
    return Directive("yInsetBottom", value)


def y_inset_top(value: AttrValue) -> Directive:
    """Insets the top edge by the specified number of pixels."""
    return Directive("yInsetTop", value)


def y_label(value: AttrValue) -> Directive:
    """A textual label to show on the axis or legend; if null, show no label."""
    return Directive("yLabel", value)


def y_label_anchor(value: AttrValue) -> Directive:
    """Where to place the axis **label** relative to the plot’s frame."""
    return Directive("yLabelAnchor", value)


def y_label_arrow(value: AttrValue) -> Directive:
    """Whether to apply a directional arrow such as → or ↑ to the x-axis scale label."""
    return Directive("yLabelArrow", value)


def y_label_offset(value: AttrValue) -> Directive:
    """The axis **label** position offset (in pixels); default depends on margins and orientation."""
    return Directive("yLabelOffset", value)


def y_line(value: AttrValue = True) -> Directive:
    """If true, draw a line along the axis; if false (default), do not."""
    return Directive("yLine", value)


def y_nice(value: AttrValue = True) -> Directive:
    """If true, or a tick count or interval, extend the domain to nice round values."""
    return Directive("yNice", value)


def y_padding(value: AttrValue) -> Directive:
    """For *band* scales, how much of the **range** to reserve to separate adjacent bands; defaults to 0.1 (10%)."""
    return Directive("yPadding", value)


def y_padding_inner(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to separate adjacent bands."""
    return Directive("yPaddingInner", value)


def y_padding_outer(value: AttrValue) -> Directive:
    """For a *band* scale, how much of the range to reserve to inset first and last bands."""
    return Directive("yPaddingOuter", value)


def y_percent(value: AttrValue = True) -> Directive:
    """If true, shorthand for a transform suitable for percentages, mapping proportions in 0, 1 to 0, 100."""
    return Directive("yPercent", value)


def y_range(value: AttrValue) -> Directive:
    """The extent of the scale’s outputs (visual values)."""
    return Directive("yRange", value)


def y_reverse(value: AttrValue = True) -> Directive:
    """Whether to reverse the scale’s encoding; equivalent to reversing either the **domain** or **range**."""
    return Directive("yReverse", value)


def y_round(value: AttrValue = True) -> Directive:
    """If true, round the output value to the nearest integer (pixel); useful for crisp edges when rendering."""
    return Directive("yRound", value)


def y_scale(value: AttrValue) -> Directive:
    """The *y* scale type, affecting how the scale encodes abstract data, say by applying a mathematical transformation."""
    return Directive("yScale", value)


def y_tick_format(value: AttrValue) -> Directive:
    """How to format inputs (abstract values) for axis tick labels; one of: - a d3-format string for numeric scales - a d3-time-format string for temporal scales : https://d3js.org/d3-time : https://d3js.org/d3-time-format"""
    return Directive("yTickFormat", value)


def y_tick_padding(value: AttrValue) -> Directive:
    """The distance between an axis tick mark and its associated text label (in pixels); often defaults to 3, but may be affected by **yTickSize** and **yTickRotate**."""
    return Directive("yTickPadding", value)


def y_tick_rotate(value: AttrValue) -> Directive:
    """The rotation angle of axis tick labels in degrees clocksize; defaults to 0."""
    return Directive("yTickRotate", value)


def y_ticks(value: AttrValue) -> Directive:
    """The desired approximate number of axis ticks, or an explicit array of tick values, or an interval such as *day* or *month*."""
    return Directive("yTicks", value)


def y_tick_size(value: AttrValue) -> Directive:
    """The length of axis tick marks in pixels; negative values extend in the opposite direction."""
    return Directive("yTickSize", value)


def y_tick_spacing(value: AttrValue) -> Directive:
    """The desired approximate spacing between adjacent axis ticks, affecting the default **ticks**; defaults to 80 pixels for *x* and *fx*, and 35 pixels for *y* and *fy*."""
    return Directive("yTickSpacing", value)


def y_zero(value: AttrValue = True) -> Directive:
    """Whether the **domain** must include zero."""
    return Directive("yZero", value)


__all__ = [
    "align",
    "aria_description",
    "aria_label",
    "aspect_ratio",
    "axis",
    "clip",
    "color_base",
    "color_clamp",
    "color_constant",
    "color_domain",
    "color_exponent",
    "color_interpolate",
    "color_label",
    "color_n",
    "color_nice",
    "color_percent",
    "color_pivot",
    "color_range",
    "color_reverse",
    "color_scale",
    "color_scheme",
    "color_symmetric",
    "color_tick_format",
    "color_zero",
    "facet_grid",
    "facet_label",
    "facet_margin",
    "facet_margin_bottom",
    "facet_margin_left",
    "facet_margin_right",
    "facet_margin_top",
    "fx_align",
    "fx_aria_description",
    "fx_aria_label",
    "fx_axis",
    "fx_domain",
    "fx_font_variant",
    "fx_grid",
    "fx_inset",
    "fx_inset_left",
    "fx_inset_right",
    "fx_label",
    "fx_label_anchor",
    "fx_label_offset",
    "fx_line",
    "fx_padding",
    "fx_padding_inner",
    "fx_padding_outer",
    "fx_range",
    "fx_reverse",
    "fx_round",
    "fx_tick_format",
    "fx_tick_padding",
    "fx_tick_rotate",
    "fx_ticks",
    "fx_tick_size",
    "fx_tick_spacing",
    "fy_align",
    "fy_aria_description",
    "fy_aria_label",
    "fy_axis",
    "fy_domain",
    "fy_font_variant",
    "fy_grid",
    "fy_inset",
    "fy_inset_bottom",
    "fy_inset_top",
    "fy_label",
    "fy_label_anchor",
    "fy_label_offset",
    "fy_line",
    "fy_padding",
    "fy_padding_inner",
    "fy_padding_outer",
    "fy_range",
    "fy_reverse",
    "fy_round",
    "fy_tick_format",
    "fy_tick_padding",
    "fy_tick_rotate",
    "fy_ticks",
    "fy_tick_size",
    "fy_tick_spacing",
    "grid",
    "height",
    "inset",
    "length_base",
    "length_clamp",
    "length_constant",
    "length_domain",
    "length_exponent",
    "length_nice",
    "length_percent",
    "length_range",
    "length_scale",
    "length_zero",
    "margin",
    "margin_bottom",
    "margin_left",
    "margin_right",
    "margin_top",
    "name",
    "opacity_base",
    "opacity_clamp",
    "opacity_constant",
    "opacity_domain",
    "opacity_exponent",
    "opacity_label",
    "opacity_nice",
    "opacity_percent",
    "opacity_range",
    "opacity_reverse",
    "opacity_scale",
    "opacity_tick_format",
    "opacity_zero",
    "padding",
    "projection_clip",
    "projection_domain",
    "projection_inset",
    "projection_inset_bottom",
    "projection_inset_left",
    "projection_inset_right",
    "projection_inset_top",
    "projection_parallels",
    "projection_precision",
    "projection_rotate",
    "projection_type",
    "r_base",
    "r_clamp",
    "r_constant",
    "r_domain",
    "r_exponent",
    "r_label",
    "r_nice",
    "r_percent",
    "r_range",
    "r_scale",
    "r_zero",
    "style",
    "symbol_domain",
    "symbol_range",
    "symbol_scale",
    "width",
    "x_align",
    "x_aria_description",
    "x_aria_label",
    "x_axis",
    "x_base",
    "x_clamp",
    "x_constant",
    "x_domain",
    "x_exponent",
    "x_font_variant",
    "x_grid",
    "x_inset",
    "x_inset_left",
    "x_inset_right",
    "x_label",
    "x_label_anchor",
    "x_label_arrow",
    "x_label_offset",
    "x_line",
    "x_nice",
    "x_padding",
    "x_padding_inner",
    "x_padding_outer",
    "x_percent",
    "x_range",
    "x_reverse",
    "x_round",
    "x_scale",
    "x_tick_format",
    "x_tick_padding",
    "x_tick_rotate",
    "x_ticks",
    "x_tick_size",
    "x_tick_spacing",
    "xy_domain",
    "x_zero",
    "y_align",
    "y_aria_description",
    "y_aria_label",
    "y_axis",
    "y_base",
    "y_clamp",
    "y_constant",
    "y_domain",
    "y_exponent",
    "y_font_variant",
    "y_grid",
    "y_inset",
    "y_inset_bottom",
    "y_inset_top",
    "y_label",
    "y_label_anchor",
    "y_label_arrow",
    "y_label_offset",
    "y_line",
    "y_nice",
    "y_padding",
    "y_padding_inner",
    "y_padding_outer",
    "y_percent",
    "y_range",
    "y_reverse",
    "y_round",
    "y_scale",
    "y_tick_format",
    "y_tick_padding",
    "y_tick_rotate",
    "y_ticks",
    "y_tick_size",
    "y_tick_spacing",
    "y_zero",
]
