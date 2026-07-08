from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any

from .util import camelize, omit_none
from .params import _ParamBase
from .data import DataDef


class FromRef:
    def __init__(self, name: str, **opts: Any):
        self.name = name
        self.opts = {camelize(k): v for k, v in opts.items() if v is not None}

    def to_dict(self) -> dict[str, Any]:
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
    data: Any | None = None
    enc: dict[str, Any] | None = None

    def to_dict(self, param_names: dict[int, str] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"mark": self.mark}
        enc = dict(self.enc or {})
        _DATA_OPTS = {"filter_by": "filterBy", "optimize": "optimize"}
        data_opts = {out: enc.pop(key) for key, out in _DATA_OPTS.items() if key in enc}
        if self.data is not None:
            if isinstance(self.data, (str, _ParamBase)):
                data_dict: Any = {"from": self.data}
            elif isinstance(self.data, FromRef):
                data_dict = dict(self.data.to_dict())
            elif isinstance(self.data, DataDef):
                data_dict = {"from": self.data}
            else:
                data_dict = self.data
            if data_opts and isinstance(data_dict, dict):
                data_dict = {**data_dict, **data_opts}
                data_opts = {}
            payload["data"] = encode_value(data_dict, param_names)
        for key, val in data_opts.items():
            payload[key] = encode_value(val, param_names)
        for k, v in enc.items():
            payload[camelize(k)] = encode_value(v, param_names)
        return payload


def encode_value(
    v: Any,
    param_names: dict[int, str] | None = None,
    data_names: dict[int, str] | None = None,
) -> Any:
    if isinstance(v, DataDef):
        if data_names and id(v) in data_names:
            return data_names[id(v)]
        return v
    if isinstance(v, _ParamBase):
        # Resolve to "$name" ref using the reverse lookup table
        if param_names and id(v) in param_names:
            return f"${param_names[id(v)]}"
        return v
    if isinstance(v, FromRef):
        return v.to_dict()
    if isinstance(v, Mark):
        return v.to_dict(param_names)
    if isinstance(v, list):
        return [encode_value(x, param_names, data_names) for x in v]
    if isinstance(v, dict):
        return {k: encode_value(val, param_names, data_names) for k, val in v.items()}
    return v


def plot(
    *items: Mark | Directive | Mapping[str, Any],
    param_names: dict[int, str] | None = None,
    **kwargs: Any,
) -> Any:
    from .spec import View

    marks: list[dict[str, Any]] = []
    directives: dict[str, Any] = {}
    for item in items:
        if isinstance(item, Mark):
            marks.append(item.to_dict(param_names))
        elif isinstance(item, Directive):
            k, v = item.to_kv()
            directives[k] = encode_value(v, param_names)
        elif isinstance(item, (dict, Mapping)):
            marks.append({k: encode_value(v, param_names) for k, v in item.items()})
        else:
            raise TypeError(f"Unsupported plot item: {item}")
    root: dict[str, Any] = {"plot": marks}
    root.update(directives)
    return View(root, **kwargs)


def directive(key: str, value: Any) -> Directive:
    return Directive(key, value)


def mark(name: str, data: Any = None, **enc: Any) -> Mark:
    return Mark(name, data=data, enc=enc)


# Mark helpers


def margins(
    top: int | None = None,
    right: int | None = None,
    bottom: int | None = None,
    left: int | None = None,
    **kwargs: Any,
) -> Directive:
    return Directive(
        "margins",
        omit_none(
            {"top": top, "right": right, "bottom": bottom, "left": left, **kwargs}
        ),
    )


def _encode_component(
    item: Any,
    param_names: dict[int, str] | None,
    data_names: dict[int, str] | None = None,
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
    *items: Any, param_names: dict[int, str] | None = None, **kwargs: Any
) -> Any:
    from .spec import View

    return View(
        {"vconcat": [_encode_component(i, param_names) for i in items]}, **kwargs
    )


def hconcat(
    *items: Any, param_names: dict[int, str] | None = None, **kwargs: Any
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


def option(label: Any, value: Any = _MISSING) -> dict[str, Any]:
    return {"label": label, "value": label if value is _MISSING else value}


def brush(**kwargs: Any) -> dict[str, Any]:
    return {camelize(k): v for k, v in kwargs.items() if v is not None}


def sort(**kwargs: Any) -> dict[str, Any]:
    return {k: v for k, v in kwargs.items() if v is not None}


# Interactor helpers
def _interactor(select: str, **opts: Any) -> dict[str, Any]:
    return omit_none({"select": select, **opts})


def interval_x(
    bind: Any = None,
    field: Any = None,
    pixel_size: Any = None,
    peers: Any = None,
    brush: Any = None,
) -> dict[str, Any]:
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
) -> dict[str, Any]:
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
) -> dict[str, Any]:
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


def toggle(bind: Any = None, channels: Any = None, peers: Any = None) -> dict[str, Any]:
    return _interactor("toggle", **{"as": bind, "channels": channels, "peers": peers})


def toggle_x(bind: Any = None, peers: Any = None) -> dict[str, Any]:
    return _interactor("toggleX", **{"as": bind, "peers": peers})


def toggle_y(bind: Any = None, peers: Any = None) -> dict[str, Any]:
    return _interactor("toggleY", **{"as": bind, "peers": peers})


def toggle_color(bind: Any = None, peers: Any = None) -> dict[str, Any]:
    return _interactor("toggleColor", **{"as": bind, "peers": peers})


def nearest_x(
    bind: Any = None, field: Any = None, channels: Any = None
) -> dict[str, Any]:
    return _interactor("nearestX", **{"as": bind, "field": field, "channels": channels})


def nearest_y(
    bind: Any = None, field: Any = None, channels: Any = None
) -> dict[str, Any]:
    return _interactor("nearestY", **{"as": bind, "field": field, "channels": channels})


def region(
    bind: Any = None, channels: Any = None, peers: Any = None, brush: Any = None
) -> dict[str, Any]:
    return _interactor(
        "region", **{"as": bind, "channels": channels, "peers": peers, "brush": brush}
    )


def highlight(by: Any = None, channels: Any = None, **kwargs: Any) -> dict[str, Any]:
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
) -> dict[str, Any]:
    return _interactor("pan", x=x, y=y, xfield=xfield, yfield=yfield)


def pan_x(x: Any = None, xfield: Any = None) -> dict[str, Any]:
    return _interactor("panX", x=x, xfield=xfield)


def pan_y(y: Any = None, yfield: Any = None) -> dict[str, Any]:
    return _interactor("panY", y=y, yfield=yfield)


def pan_zoom(
    x: Any = None, y: Any = None, xfield: Any = None, yfield: Any = None
) -> dict[str, Any]:
    return _interactor("panZoom", x=x, y=y, xfield=xfield, yfield=yfield)


def pan_zoom_x(x: Any = None, xfield: Any = None) -> dict[str, Any]:
    return _interactor("panZoomX", x=x, xfield=xfield)


def pan_zoom_y(y: Any = None, yfield: Any = None) -> dict[str, Any]:
    return _interactor("panZoomY", y=y, yfield=yfield)


# Legend helpers
def _legend(
    kind: str,
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> dict[str, Any]:
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
) -> dict[str, Any]:
    return _legend(
        "color", plot=plot, bind=bind, label=label, columns=columns, **kwargs
    )


def opacity_legend(
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> dict[str, Any]:
    return _legend(
        "opacity", plot=plot, bind=bind, label=label, columns=columns, **kwargs
    )


def symbol_legend(
    plot: Any = None,
    bind: Any = None,
    label: Any = None,
    columns: Any = None,
    **kwargs: Any,
) -> dict[str, Any]:
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
        payload[key] = v  # pyright: ignore[reportArgumentType]
    return View(payload)


def slider(
    label: str,
    bind: Any,
    min: Any = None,
    max: Any = None,
    step: Any = None,
    value: Any = None,
    **opts: Any,
) -> Any:
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
) -> Any:
    return input(
        "select",
        label=label,
        bind=bind,
        options=options,
        multiple=multiple,
        value=value,
        **opts,
    )


def checkbox(label: str, bind: Any, value: bool = False, **opts: Any) -> Any:
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
) -> Any:
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
) -> Any:
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
) -> Any:
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
