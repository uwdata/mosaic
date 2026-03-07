from .spec import meta, spec, Spec
from .data import parquet, table, data
from .plot import (
    plot,
    from_,
    rule_y,
    rule_x,
    line_y,
    line_x,
    bar_y,
    bar_x,
    area_y,
    area_x,
    text,
    dot,
    density,
    y_grid,
    y_label,
    y_tick_format,
    x_tick_format,
    x_axis,
    y_axis,
    x_label,
    x_label_anchor,
    y_label_anchor,
    r_range,
    color_domain,
    color_scale,
    x_tick_size,
    y_tick_size,
    width,
    height,
    margins,
    vconcat,
    hconcat,
    vspace,
    hspace,
    mark,
    directive,
    slider,
    select,
    checkbox,
    input,
)

__all__ = [
    "meta",
    "spec",
    "Spec",
    "parquet",
    "table",
    "data",
    "plot",
    "from_",
    "mark",
    "rule_y",
    "rule_x",
    "line_y",
    "line_x",
    "bar_y",
    "bar_x",
    "area_y",
    "area_x",
    "text",
    "dot",
    "density",
    "y_grid",
    "y_label",
    "y_tick_format",
    "x_tick_format",
    "x_axis",
    "y_axis",
    "x_label",
    "x_label_anchor",
    "y_label_anchor",
    "r_range",
    "color_domain",
    "color_scale",
    "x_tick_size",
    "y_tick_size",
    "width",
    "height",
    "margins",
    "vconcat",
    "hconcat",
    "vspace",
    "hspace",
    "directive",
    "slider",
    "select",
    "checkbox",
    "input",
]


def __getattr__(name: str):
    """Dynamic mark/directive factory for names not explicitly exported.

    Allows any snake_case mark or directive to be used without an explicit
    function definition, e.g.::
    """
    if name.startswith("_"):
        raise AttributeError(name)

    from .plot import Directive, Mark
    from .util import camelize

    camel = camelize(name)

    def _factory(*args, data=None, **kwargs):
        if len(args) == 1 and data is None and not kwargs:
            # Single positional arg to directive
            return Directive(camel, args[0])
        # otherwise creates a mark
        return Mark(camel, data=data, enc=kwargs if kwargs else None)

    _factory.__name__ = name
    _factory.__qualname__ = f"vgplot.{name}"
    return _factory
