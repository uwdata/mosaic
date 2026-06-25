from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from .util import camelize, omit_none
from .params import _ParamBase
from .data import DataDef


class FromRef:
    def __init__(self, name: str, **opts: Any):
        self.name = name
        self.opts = {camelize(k): v for k, v in opts.items() if v is not None}

    def to_dict(self) -> Dict[str, Any]:
        return {"from": self.name, **self.opts}


def source(name: str, **opts: Any) -> FromRef:
    return FromRef(name, **opts)


@dataclass
class Directive:
    key: str
    value: Any

    def to_kv(self):
        return camelize(self.key), self.value


@dataclass
class Mark:
    mark: str
    data: Optional[Any] = None
    enc: Optional[Dict[str, Any]] = None

    def to_dict(self, param_names: Dict[int, str] | None = None) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"mark": self.mark}
        enc = dict(self.enc or {})
        _DATA_OPTS = {"filter_by": "filterBy", "optimize": "optimize"}
        data_opts = {out: enc.pop(key) for key, out in _DATA_OPTS.items() if key in enc}
        if self.data is not None:
            if isinstance(self.data, (str, _ParamBase)):
                data_dict: Any = {"from": self.data}
            elif isinstance(self.data, FromRef):
                data_dict = dict(self.data.to_dict())
            else:
                data_dict = self.data
            if data_opts and isinstance(data_dict, dict):
                data_dict = {**data_dict, **data_opts}
            payload["data"] = encode_value(data_dict, param_names)
        for k, v in enc.items():
            payload[camelize(k)] = encode_value(v, param_names)
        return payload


def encode_value(
    v: Any,
    param_names: Dict[int, str] | None = None,
    data_names: Dict[int, str] | None = None,
) -> Any:
    if isinstance(v, DataDef):
        if data_names and id(v) in data_names:
            return {"from": data_names[id(v)]}
        return v
    if isinstance(v, _ParamBase):
        # Resolve to "$name" ref using the reverse lookup table
        if param_names and id(v) in param_names:
            return f"${param_names[id(v)]}"
        return v
    if isinstance(v, FromRef):
        return v.to_dict()
    if isinstance(v, Mark):
        return v.to_dict()
    if isinstance(v, list):
        return [encode_value(x, param_names, data_names) for x in v]
    if isinstance(v, dict):
        return {k: encode_value(val, param_names, data_names) for k, val in v.items()}
    return v


def plot(
    *items: Union[Mark, Directive],
    param_names: Dict[int, str] | None = None,
    **kwargs: Any,
) -> Any:
    from .spec import View

    marks: List[Dict[str, Any]] = []
    directives: Dict[str, Any] = {}
    for item in items:
        if isinstance(item, Mark):
            marks.append(item.to_dict(param_names))
        elif isinstance(item, Directive):
            k, v = item.to_kv()
            directives[k] = encode_value(v, param_names)
        elif isinstance(item, dict):
            marks.append({k: encode_value(v, param_names) for k, v in item.items()})
        else:
            raise TypeError(f"Unsupported plot item: {item}")
    root: Dict[str, Any] = {"plot": marks}
    root.update(directives)
    return View(root, **kwargs)


def directive(key: str, value: Any) -> Directive:
    return Directive(key, value)


def mark(name: str, data: Any = None, **enc: Any) -> Mark:
    return Mark(name, data=data, enc=enc)


# Mark helpers
def rule_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("ruleY", data=data, enc=enc)


def rule_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("ruleX", data=data, enc=enc)


def line_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("lineY", data=data, enc=enc)


def line_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("lineX", data=data, enc=enc)


def bar_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("barY", data=data, enc=enc)


def bar_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("barX", data=data, enc=enc)


def area_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("areaY", data=data, enc=enc)


def area_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("areaX", data=data, enc=enc)


def text(data: Any = None, **enc: Any) -> Mark:
    return Mark("text", data=data, enc=enc)


def dot(data: Any = None, **enc: Any) -> Mark:
    return Mark("dot", data=data, enc=enc)


def density(data: Any = None, **enc: Any) -> Mark:
    return Mark("density", data=data, enc=enc)


def y_grid(value: bool) -> Directive:
    return Directive("y_grid", value)


def y_label(value: str) -> Directive:
    return Directive("y_label", value)


def y_tick_format(value: str) -> Directive:
    return Directive("y_tick_format", value)


def x_tick_format(value: str) -> Directive:
    return Directive("x_tick_format", value)


def x_axis(value: Any) -> Directive:
    return Directive("x_axis", value)


def y_axis(value: Any) -> Directive:
    return Directive("y_axis", value)


def x_label(value: str) -> Directive:
    return Directive("x_label", value)


def x_label_anchor(value: str) -> Directive:
    return Directive("x_label_anchor", value)


def y_label_anchor(value: str) -> Directive:
    return Directive("y_label_anchor", value)


def r_range(value: Any) -> Directive:
    return Directive("r_range", value)


def color_domain(value: Any) -> Directive:
    return Directive("color_domain", value)


def color_scale(value: Any) -> Directive:
    return Directive("color_scale", value)


def width(value: int) -> Directive:
    return Directive("width", value)


def height(value: int) -> Directive:
    return Directive("height", value)


def margins(
    top: int = None,
    right: int = None,
    bottom: int = None,
    left: int = None,
    **kwargs: Any,
) -> Directive:
    return Directive(
        "margins",
        omit_none(
            {"top": top, "right": right, "bottom": bottom, "left": left, **kwargs}
        ),
    )


def x_tick_size(value: Any) -> Directive:
    return Directive("x_tick_size", value)


def y_tick_size(value: Any) -> Directive:
    return Directive("y_tick_size", value)


def _encode_component(
    item: Any,
    param_names: Dict[int, str] | None,
    data_names: Dict[int, str] | None = None,
) -> Any:
    from .spec import View

    if isinstance(item, View):
        item = item._view
    if isinstance(item, dict) and "plot" in item:
        # re-encode an already-built plot dict so param refs resolve
        marks = [
            (
                {k: encode_value(v, param_names, data_names) for k, v in m.items()}
                if isinstance(m, dict)
                else m
            )
            for m in item["plot"]
        ]
        rest = {
            k: encode_value(v, param_names, data_names)
            for k, v in item.items()
            if k != "plot"
        }
        return {"plot": marks, **rest}
    return encode_value(item, param_names, data_names)


# Layout helpers
def vconcat(
    *items: Any, param_names: Dict[int, str] | None = None, **kwargs: Any
) -> Any:
    from .spec import View

    return View(
        {"vconcat": [_encode_component(i, param_names) for i in items]}, **kwargs
    )


def hconcat(
    *items: Any, param_names: Dict[int, str] | None = None, **kwargs: Any
) -> Any:
    from .spec import View

    return View(
        {"hconcat": [_encode_component(i, param_names) for i in items]}, **kwargs
    )


def hspace(px: int) -> Any:
    from .spec import View

    return View({"hspace": px})


def vspace(px: int) -> Any:
    from .spec import View

    return View({"vspace": px})


_MISSING = object()


def option(label: Any, value: Any = _MISSING) -> Dict[str, Any]:
    return {"label": label, "value": label if value is _MISSING else value}


def brush(**kwargs: Any) -> Dict[str, Any]:
    return {camelize(k): v for k, v in kwargs.items() if v is not None}


def sort(**kwargs: Any) -> Dict[str, Any]:
    return {k: v for k, v in kwargs.items() if v is not None}


# Interactor helpers
def _interactor(select: str, **opts: Any) -> Dict[str, Any]:
    return omit_none({"select": select, **opts})


def interval_x(
    bind: Any = None,
    field: Any = None,
    pixel_size: Any = None,
    peers: Any = None,
    brush: Any = None,
) -> Dict[str, Any]:
    return _interactor(
        "intervalX",
        **{
            "as": bind,
            "field": field,
            "pixelSize": pixel_size,
            "peers": peers,
            "brush": brush,
        },
    )


def interval_y(
    bind: Any = None,
    field: Any = None,
    pixel_size: Any = None,
    peers: Any = None,
    brush: Any = None,
) -> Dict[str, Any]:
    return _interactor(
        "intervalY",
        **{
            "as": bind,
            "field": field,
            "pixelSize": pixel_size,
            "peers": peers,
            "brush": brush,
        },
    )


def interval_xy(
    bind: Any = None,
    xfield: Any = None,
    yfield: Any = None,
    pixel_size: Any = None,
    peers: Any = None,
    brush: Any = None,
) -> Dict[str, Any]:
    return _interactor(
        "intervalXY",
        **{
            "as": bind,
            "xfield": xfield,
            "yfield": yfield,
            "pixelSize": pixel_size,
            "peers": peers,
            "brush": brush,
        },
    )


def toggle(bind: Any = None, channels: Any = None, peers: Any = None) -> Dict[str, Any]:
    return _interactor("toggle", **{"as": bind, "channels": channels, "peers": peers})


def toggle_x(bind: Any = None, peers: Any = None) -> Dict[str, Any]:
    return _interactor("toggleX", **{"as": bind, "peers": peers})


def toggle_y(bind: Any = None, peers: Any = None) -> Dict[str, Any]:
    return _interactor("toggleY", **{"as": bind, "peers": peers})


def toggle_color(bind: Any = None, peers: Any = None) -> Dict[str, Any]:
    return _interactor("toggleColor", **{"as": bind, "peers": peers})


def nearest_x(
    bind: Any = None, field: Any = None, channels: Any = None
) -> Dict[str, Any]:
    return _interactor("nearestX", **{"as": bind, "field": field, "channels": channels})


def nearest_y(
    bind: Any = None, field: Any = None, channels: Any = None
) -> Dict[str, Any]:
    return _interactor("nearestY", **{"as": bind, "field": field, "channels": channels})


def region(
    bind: Any = None, channels: Any = None, peers: Any = None, brush: Any = None
) -> Dict[str, Any]:
    return _interactor(
        "region", **{"as": bind, "channels": channels, "peers": peers, "brush": brush}
    )


def highlight(by: Any = None, channels: Any = None, **kwargs: Any) -> Dict[str, Any]:
    return omit_none(
        {
            "select": "highlight",
            "by": by,
            "channels": channels,
            **{camelize(k): v for k, v in kwargs.items()},
        }
    )


def pan(
    x: Any = None, y: Any = None, xfield: Any = None, yfield: Any = None
) -> Dict[str, Any]:
    return _interactor("pan", x=x, y=y, xfield=xfield, yfield=yfield)


def pan_x(x: Any = None, xfield: Any = None) -> Dict[str, Any]:
    return _interactor("panX", x=x, xfield=xfield)


def pan_y(y: Any = None, yfield: Any = None) -> Dict[str, Any]:
    return _interactor("panY", y=y, yfield=yfield)


def pan_zoom(
    x: Any = None, y: Any = None, xfield: Any = None, yfield: Any = None
) -> Dict[str, Any]:
    return _interactor("panZoom", x=x, y=y, xfield=xfield, yfield=yfield)


def pan_zoom_x(x: Any = None, xfield: Any = None) -> Dict[str, Any]:
    return _interactor("panZoomX", x=x, xfield=xfield)


def pan_zoom_y(y: Any = None, yfield: Any = None) -> Dict[str, Any]:
    return _interactor("panZoomY", y=y, yfield=yfield)


# Legend helpers
def _legend(
    kind: str,
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    return omit_none(
        {
            "legend": kind,
            "for": plot,
            "as": bind,
            "label": label,
            "columns": columns,
            **{camelize(k): v for k, v in kwargs.items()},
        }
    )


def color_legend(
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    return _legend(
        "color", plot=plot, bind=bind, label=label, columns=columns, **kwargs
    )


def opacity_legend(
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    return _legend(
        "opacity", plot=plot, bind=bind, label=label, columns=columns, **kwargs
    )


def symbol_legend(
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> Dict[str, Any]:
    return _legend(
        "symbol", plot=plot, bind=bind, label=label, columns=columns, **kwargs
    )


# Input helpers
_INPUT_ALIASES = {"bind": "as", "source": "from"}


def input(kind: str, **opts: Any) -> Any:
    from .spec import View

    payload = {"input": kind}
    for k, v in opts.items():
        if v is None:
            continue
        key = _INPUT_ALIASES.get(k, camelize(k))
        if (
            key == "options"
            and isinstance(v, list)
            and any(isinstance(i, dict) for i in v)
        ):
            v = [{"label": i, "value": i} if not isinstance(i, dict) else i for i in v]
        payload[key] = v
    return View(payload)


def slider(
    label: str,
    bind: Any,
    min: Any = None,
    max: Any = None,
    step: Any = None,
    value: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "slider",
        label=label,
        bind=bind,
        min=min,
        max=max,
        step=step,
        value=value,
        **opts,
    )


def select(
    label: str,
    bind: Any,
    options: Any,
    multiple: bool = False,
    value: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "select",
        label=label,
        bind=bind,
        options=options,
        multiple=multiple,
        value=value,
        **opts,
    )


def checkbox(label: str, bind: Any, value: bool = False, **opts: Any) -> Dict[str, Any]:
    return input("checkbox", label=label, bind=bind, value=value, **opts)


def menu(
    label: Any = None,
    bind: Any = None,
    options: Any = None,
    value: Any = None,
    source: Any = None,
    column: Any = None,
    filter_by: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "menu",
        label=label,
        bind=bind,
        options=options,
        value=value,
        source=source,
        column=column,
        filter_by=filter_by,
        **opts,
    )


def search(
    label: Any = None,
    bind: Any = None,
    source: Any = None,
    column: Any = None,
    filter_by: Any = None,
    type: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "search",
        label=label,
        bind=bind,
        source=source,
        column=column,
        filter_by=filter_by,
        type=type,
        **opts,
    )


def table_input(
    source: Any,
    bind: Any = None,
    columns: Any = None,
    filter_by: Any = None,
    width: Any = None,
    height: Any = None,
    max_width: Any = None,
    row_batch: Any = None,
    align: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "table",
        source=source,
        bind=bind,
        columns=columns,
        filter_by=filter_by,
        width=width,
        height=height,
        max_width=max_width,
        row_batch=row_batch,
        align=align,
        **opts,
    )


# Mark helpers


def area(data: Any = None, **enc: Any) -> Mark:
    return Mark("area", data=data, enc=enc)


def arrow(data: Any = None, **enc: Any) -> Mark:
    return Mark("arrow", data=data, enc=enc)


def axis_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("axisX", data=data, enc=enc)


def axis_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("axisY", data=data, enc=enc)


def axis_fx(data: Any = None, **enc: Any) -> Mark:
    return Mark("axisFx", data=data, enc=enc)


def axis_fy(data: Any = None, **enc: Any) -> Mark:
    return Mark("axisFy", data=data, enc=enc)


def cell(data: Any = None, **enc: Any) -> Mark:
    return Mark("cell", data=data, enc=enc)


def cell_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("cellX", data=data, enc=enc)


def cell_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("cellY", data=data, enc=enc)


def contour(data: Any = None, **enc: Any) -> Mark:
    return Mark("contour", data=data, enc=enc)


def voronoi(data: Any = None, **enc: Any) -> Mark:
    return Mark("voronoi", data=data, enc=enc)


def voronoi_mesh(data: Any = None, **enc: Any) -> Mark:
    return Mark("voronoiMesh", data=data, enc=enc)


def delaunay_link(data: Any = None, **enc: Any) -> Mark:
    return Mark("delaunayLink", data=data, enc=enc)


def delaunay_mesh(data: Any = None, **enc: Any) -> Mark:
    return Mark("delaunayMesh", data=data, enc=enc)


def hull(data: Any = None, **enc: Any) -> Mark:
    return Mark("hull", data=data, enc=enc)


def density_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("densityX", data=data, enc=enc)


def density_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("densityY", data=data, enc=enc)


def dense_line(data: Any = None, **enc: Any) -> Mark:
    return Mark("denseLine", data=data, enc=enc)


def dot_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("dotX", data=data, enc=enc)


def dot_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("dotY", data=data, enc=enc)


def circle(data: Any = None, **enc: Any) -> Mark:
    return Mark("circle", data=data, enc=enc)


def hexagon(data: Any = None, **enc: Any) -> Mark:
    return Mark("hexagon", data=data, enc=enc)


def frame(data: Any = None, **enc: Any) -> Mark:
    return Mark("frame", data=data, enc=enc)


def geo(data: Any = None, **enc: Any) -> Mark:
    return Mark("geo", data=data, enc=enc)


def sphere(data: Any = None, **enc: Any) -> Mark:
    return Mark("sphere", data=data, enc=enc)


def graticule(data: Any = None, **enc: Any) -> Mark:
    return Mark("graticule", data=data, enc=enc)


def grid_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("gridX", data=data, enc=enc)


def grid_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("gridY", data=data, enc=enc)


def grid_fx(data: Any = None, **enc: Any) -> Mark:
    return Mark("gridFx", data=data, enc=enc)


def grid_fy(data: Any = None, **enc: Any) -> Mark:
    return Mark("gridFy", data=data, enc=enc)


def hexgrid(data: Any = None, **enc: Any) -> Mark:
    return Mark("hexgrid", data=data, enc=enc)


def heatmap(data: Any = None, **enc: Any) -> Mark:
    return Mark("heatmap", data=data, enc=enc)


def hexbin(data: Any = None, **enc: Any) -> Mark:
    return Mark("hexbin", data=data, enc=enc)


def image(data: Any = None, **enc: Any) -> Mark:
    return Mark("image", data=data, enc=enc)


def line(data: Any = None, **enc: Any) -> Mark:
    return Mark("line", data=data, enc=enc)


def regression_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("regressionY", data=data, enc=enc)


def link(data: Any = None, **enc: Any) -> Mark:
    return Mark("link", data=data, enc=enc)


def raster(data: Any = None, **enc: Any) -> Mark:
    return Mark("raster", data=data, enc=enc)


def rect(data: Any = None, **enc: Any) -> Mark:
    return Mark("rect", data=data, enc=enc)


def rect_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("rectX", data=data, enc=enc)


def rect_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("rectY", data=data, enc=enc)


def tick_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("tickX", data=data, enc=enc)


def tick_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("tickY", data=data, enc=enc)


def text_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("textX", data=data, enc=enc)


def text_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("textY", data=data, enc=enc)


def vector(data: Any = None, **enc: Any) -> Mark:
    return Mark("vector", data=data, enc=enc)


def vector_x(data: Any = None, **enc: Any) -> Mark:
    return Mark("vectorX", data=data, enc=enc)


def vector_y(data: Any = None, **enc: Any) -> Mark:
    return Mark("vectorY", data=data, enc=enc)


def spike(data: Any = None, **enc: Any) -> Mark:
    return Mark("spike", data=data, enc=enc)


# Plot attribute helpers


def name(value: Any) -> Directive:
    return Directive("name", value)


def style(value: Any) -> Directive:
    return Directive("style", value)


def margin(value: Any) -> Directive:
    return Directive("margin", value)


def margin_left(value: Any) -> Directive:
    return Directive("margin_left", value)


def margin_right(value: Any) -> Directive:
    return Directive("margin_right", value)


def margin_top(value: Any) -> Directive:
    return Directive("margin_top", value)


def margin_bottom(value: Any) -> Directive:
    return Directive("margin_bottom", value)


def align(value: Any) -> Directive:
    return Directive("align", value)


def aspect_ratio(value: Any) -> Directive:
    return Directive("aspect_ratio", value)


def inset(value: Any) -> Directive:
    return Directive("inset", value)


def axis(value: Any) -> Directive:
    return Directive("axis", value)


def grid(value: Any) -> Directive:
    return Directive("grid", value)


def label(value: Any) -> Directive:
    return Directive("label", value)


def padding(value: Any) -> Directive:
    return Directive("padding", value)


def round(value: Any) -> Directive:
    return Directive("round", value)


# X scale helpers


def x_scale(value: Any) -> Directive:
    return Directive("x_scale", value)


def x_domain(value: Any) -> Directive:
    return Directive("x_domain", value)


def x_range(value: Any) -> Directive:
    return Directive("x_range", value)


def x_nice(value: Any = True) -> Directive:
    return Directive("x_nice", value)


def x_inset(value: Any) -> Directive:
    return Directive("x_inset", value)


def x_inset_left(value: Any) -> Directive:
    return Directive("x_inset_left", value)


def x_inset_right(value: Any) -> Directive:
    return Directive("x_inset_right", value)


def x_clamp(value: bool = True) -> Directive:
    return Directive("x_clamp", value)


def x_round(value: bool = True) -> Directive:
    return Directive("x_round", value)


def x_align(value: Any) -> Directive:
    return Directive("x_align", value)


def x_padding(value: Any) -> Directive:
    return Directive("x_padding", value)


def x_padding_inner(value: Any) -> Directive:
    return Directive("x_padding_inner", value)


def x_padding_outer(value: Any) -> Directive:
    return Directive("x_padding_outer", value)


def x_ticks(value: Any) -> Directive:
    return Directive("x_ticks", value)


def x_tick_spacing(value: Any) -> Directive:
    return Directive("x_tick_spacing", value)


def x_tick_padding(value: Any) -> Directive:
    return Directive("x_tick_padding", value)


def x_tick_rotate(value: Any) -> Directive:
    return Directive("x_tick_rotate", value)


def x_grid(value: Any) -> Directive:
    return Directive("x_grid", value)


def x_line(value: Any) -> Directive:
    return Directive("x_line", value)


def x_label_offset(value: Any) -> Directive:
    return Directive("x_label_offset", value)


def x_font_variant(value: Any) -> Directive:
    return Directive("x_font_variant", value)


def x_aria_label(value: Any) -> Directive:
    return Directive("x_aria_label", value)


def x_aria_description(value: Any) -> Directive:
    return Directive("x_aria_description", value)


def x_reverse(value: bool = True) -> Directive:
    return Directive("x_reverse", value)


def x_zero(value: bool = True) -> Directive:
    return Directive("x_zero", value)


# Y scale helpers


def y_scale(value: Any) -> Directive:
    return Directive("y_scale", value)


def y_domain(value: Any) -> Directive:
    return Directive("y_domain", value)


def y_range(value: Any) -> Directive:
    return Directive("y_range", value)


def y_nice(value: Any = True) -> Directive:
    return Directive("y_nice", value)


def y_inset(value: Any) -> Directive:
    return Directive("y_inset", value)


def y_inset_top(value: Any) -> Directive:
    return Directive("y_inset_top", value)


def y_inset_bottom(value: Any) -> Directive:
    return Directive("y_inset_bottom", value)


def y_clamp(value: bool = True) -> Directive:
    return Directive("y_clamp", value)


def y_round(value: bool = True) -> Directive:
    return Directive("y_round", value)


def y_align(value: Any) -> Directive:
    return Directive("y_align", value)


def y_padding(value: Any) -> Directive:
    return Directive("y_padding", value)


def y_padding_inner(value: Any) -> Directive:
    return Directive("y_padding_inner", value)


def y_padding_outer(value: Any) -> Directive:
    return Directive("y_padding_outer", value)


def y_ticks(value: Any) -> Directive:
    return Directive("y_ticks", value)


def y_tick_spacing(value: Any) -> Directive:
    return Directive("y_tick_spacing", value)


def y_tick_padding(value: Any) -> Directive:
    return Directive("y_tick_padding", value)


def y_tick_rotate(value: Any) -> Directive:
    return Directive("y_tick_rotate", value)


def y_line(value: Any) -> Directive:
    return Directive("y_line", value)


def y_label_offset(value: Any) -> Directive:
    return Directive("y_label_offset", value)


def y_font_variant(value: Any) -> Directive:
    return Directive("y_font_variant", value)


def y_aria_label(value: Any) -> Directive:
    return Directive("y_aria_label", value)


def y_aria_description(value: Any) -> Directive:
    return Directive("y_aria_description", value)


def y_reverse(value: bool = True) -> Directive:
    return Directive("y_reverse", value)


def y_zero(value: bool = True) -> Directive:
    return Directive("y_zero", value)


# Color scale helpers


def color_range(value: Any) -> Directive:
    return Directive("color_range", value)


def color_clamp(value: bool = True) -> Directive:
    return Directive("color_clamp", value)


def color_nice(value: Any = True) -> Directive:
    return Directive("color_nice", value)


def color_scheme(value: Any) -> Directive:
    return Directive("color_scheme", value)


def color_interpolate(value: Any) -> Directive:
    return Directive("color_interpolate", value)


def color_pivot(value: Any) -> Directive:
    return Directive("color_pivot", value)


def color_symmetric(value: bool = True) -> Directive:
    return Directive("color_symmetric", value)


def color_label(value: Any) -> Directive:
    return Directive("color_label", value)


def color_reverse(value: bool = True) -> Directive:
    return Directive("color_reverse", value)


def color_zero(value: bool = True) -> Directive:
    return Directive("color_zero", value)


def color_tick_format(value: Any) -> Directive:
    return Directive("color_tick_format", value)


# Opacity scale helpers


def opacity_scale(value: Any) -> Directive:
    return Directive("opacity_scale", value)


def opacity_domain(value: Any) -> Directive:
    return Directive("opacity_domain", value)


def opacity_range(value: Any) -> Directive:
    return Directive("opacity_range", value)


def opacity_clamp(value: bool = True) -> Directive:
    return Directive("opacity_clamp", value)


def opacity_nice(value: Any = True) -> Directive:
    return Directive("opacity_nice", value)


def opacity_label(value: Any) -> Directive:
    return Directive("opacity_label", value)


def opacity_reverse(value: bool = True) -> Directive:
    return Directive("opacity_reverse", value)


def opacity_zero(value: bool = True) -> Directive:
    return Directive("opacity_zero", value)


def opacity_tick_format(value: Any) -> Directive:
    return Directive("opacity_tick_format", value)


# R scale helpers


def r_scale(value: Any) -> Directive:
    return Directive("r_scale", value)


def r_domain(value: Any) -> Directive:
    return Directive("r_domain", value)


def r_clamp(value: bool = True) -> Directive:
    return Directive("r_clamp", value)


def r_nice(value: Any = True) -> Directive:
    return Directive("r_nice", value)


def r_label(value: Any) -> Directive:
    return Directive("r_label", value)


def r_zero(value: bool = True) -> Directive:
    return Directive("r_zero", value)


# Length scale helpers


def length_scale(value: Any) -> Directive:
    return Directive("length_scale", value)


def length_domain(value: Any) -> Directive:
    return Directive("length_domain", value)


def length_range(value: Any) -> Directive:
    return Directive("length_range", value)


def length_clamp(value: bool = True) -> Directive:
    return Directive("length_clamp", value)


def length_nice(value: Any = True) -> Directive:
    return Directive("length_nice", value)


def length_zero(value: bool = True) -> Directive:
    return Directive("length_zero", value)


# FX scale helpers


def fx_domain(value: Any) -> Directive:
    return Directive("fx_domain", value)


def fx_range(value: Any) -> Directive:
    return Directive("fx_range", value)


def fx_inset(value: Any) -> Directive:
    return Directive("fx_inset", value)


def fx_inset_left(value: Any) -> Directive:
    return Directive("fx_inset_left", value)


def fx_inset_right(value: Any) -> Directive:
    return Directive("fx_inset_right", value)


def fx_round(value: bool = True) -> Directive:
    return Directive("fx_round", value)


def fx_align(value: Any) -> Directive:
    return Directive("fx_align", value)


def fx_padding(value: Any) -> Directive:
    return Directive("fx_padding", value)


def fx_padding_inner(value: Any) -> Directive:
    return Directive("fx_padding_inner", value)


def fx_padding_outer(value: Any) -> Directive:
    return Directive("fx_padding_outer", value)


def fx_axis(value: Any) -> Directive:
    return Directive("fx_axis", value)


def fx_tick_size(value: Any) -> Directive:
    return Directive("fx_tick_size", value)


def fx_tick_padding(value: Any) -> Directive:
    return Directive("fx_tick_padding", value)


def fx_tick_format(value: Any) -> Directive:
    return Directive("fx_tick_format", value)


def fx_tick_rotate(value: Any) -> Directive:
    return Directive("fx_tick_rotate", value)


def fx_grid(value: Any) -> Directive:
    return Directive("fx_grid", value)


def fx_label(value: Any) -> Directive:
    return Directive("fx_label", value)


def fx_label_anchor(value: Any) -> Directive:
    return Directive("fx_label_anchor", value)


def fx_label_offset(value: Any) -> Directive:
    return Directive("fx_label_offset", value)


def fx_font_variant(value: Any) -> Directive:
    return Directive("fx_font_variant", value)


def fx_aria_label(value: Any) -> Directive:
    return Directive("fx_aria_label", value)


def fx_aria_description(value: Any) -> Directive:
    return Directive("fx_aria_description", value)


def fx_reverse(value: bool = True) -> Directive:
    return Directive("fx_reverse", value)


# FY scale helpers


def fy_domain(value: Any) -> Directive:
    return Directive("fy_domain", value)


def fy_range(value: Any) -> Directive:
    return Directive("fy_range", value)


def fy_inset(value: Any) -> Directive:
    return Directive("fy_inset", value)


def fy_inset_top(value: Any) -> Directive:
    return Directive("fy_inset_top", value)


def fy_inset_bottom(value: Any) -> Directive:
    return Directive("fy_inset_bottom", value)


def fy_round(value: bool = True) -> Directive:
    return Directive("fy_round", value)


def fy_align(value: Any) -> Directive:
    return Directive("fy_align", value)


def fy_padding(value: Any) -> Directive:
    return Directive("fy_padding", value)


def fy_padding_inner(value: Any) -> Directive:
    return Directive("fy_padding_inner", value)


def fy_padding_outer(value: Any) -> Directive:
    return Directive("fy_padding_outer", value)


def fy_axis(value: Any) -> Directive:
    return Directive("fy_axis", value)


def fy_tick_size(value: Any) -> Directive:
    return Directive("fy_tick_size", value)


def fy_tick_padding(value: Any) -> Directive:
    return Directive("fy_tick_padding", value)


def fy_tick_format(value: Any) -> Directive:
    return Directive("fy_tick_format", value)


def fy_tick_rotate(value: Any) -> Directive:
    return Directive("fy_tick_rotate", value)


def fy_grid(value: Any) -> Directive:
    return Directive("fy_grid", value)


def fy_label(value: Any) -> Directive:
    return Directive("fy_label", value)


def fy_label_anchor(value: Any) -> Directive:
    return Directive("fy_label_anchor", value)


def fy_label_offset(value: Any) -> Directive:
    return Directive("fy_label_offset", value)


def fy_font_variant(value: Any) -> Directive:
    return Directive("fy_font_variant", value)


def fy_aria_label(value: Any) -> Directive:
    return Directive("fy_aria_label", value)


def fy_aria_description(value: Any) -> Directive:
    return Directive("fy_aria_description", value)


def fy_reverse(value: bool = True) -> Directive:
    return Directive("fy_reverse", value)


# Facet helpers


def facet_margin(value: Any) -> Directive:
    return Directive("facet_margin", value)


def facet_margin_top(value: Any) -> Directive:
    return Directive("facet_margin_top", value)


def facet_margin_bottom(value: Any) -> Directive:
    return Directive("facet_margin_bottom", value)


def facet_margin_left(value: Any) -> Directive:
    return Directive("facet_margin_left", value)


def facet_margin_right(value: Any) -> Directive:
    return Directive("facet_margin_right", value)


def facet_grid(value: Any) -> Directive:
    return Directive("facet_grid", value)


def facet_label(value: Any) -> Directive:
    return Directive("facet_label", value)


# Projection helpers


def projection_type(value: Any) -> Directive:
    return Directive("projection_type", value)


def projection_parallels(value: Any) -> Directive:
    return Directive("projection_parallels", value)


def projection_precision(value: Any) -> Directive:
    return Directive("projection_precision", value)


def projection_rotate(value: Any) -> Directive:
    return Directive("projection_rotate", value)


def projection_domain(value: Any) -> Directive:
    return Directive("projection_domain", value)


def projection_inset(value: Any) -> Directive:
    return Directive("projection_inset", value)


def projection_inset_left(value: Any) -> Directive:
    return Directive("projection_inset_left", value)


def projection_inset_right(value: Any) -> Directive:
    return Directive("projection_inset_right", value)


def projection_inset_top(value: Any) -> Directive:
    return Directive("projection_inset_top", value)


def projection_inset_bottom(value: Any) -> Directive:
    return Directive("projection_inset_bottom", value)


def projection_clip(value: Any) -> Directive:
    return Directive("projection_clip", value)
