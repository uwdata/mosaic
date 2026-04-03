from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from .util import camelize, omit_none


class FromRef:
    def __init__(self, name: str):
        self.name = name

    def to_dict(self) -> Dict[str, str]:
        return {"from": self.name}


def from_(name: str) -> FromRef:
    return FromRef(name)


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

    def to_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {"mark": self.mark}
        if self.data is not None:
            payload["data"] = encode_value(self.data)
        if self.enc:
            for k, v in self.enc.items():
                payload[camelize(k)] = encode_value(v)
        return payload


def encode_value(v: Any) -> Any:
    if isinstance(v, FromRef):
        return v.to_dict()
    if isinstance(v, Mark):
        return v.to_dict()
    if isinstance(v, list):
        return [encode_value(x) for x in v]
    if isinstance(v, dict):
        return {k: encode_value(val) for k, val in v.items()}
    return v


def plot(*items: Union[Mark, Directive]) -> Dict[str, Any]:
    marks: List[Dict[str, Any]] = []
    directives: Dict[str, Any] = {}
    for item in items:
        if isinstance(item, Mark):
            marks.append(item.to_dict())
        elif isinstance(item, Directive):
            k, v = item.to_kv()
            directives[k] = v
        elif isinstance(item, dict):
            # Treat dicts as already-structured mark entries.
            marks.append(item)
        else:
            raise TypeError(f"Unsupported plot item: {item}")
    root: Dict[str, Any] = {"plot": marks}
    root.update(directives)
    return root


def directive(key: str, value: Any) -> Directive:
    return Directive(key, value)


def mark(name: str, data: Any = None, **enc: Any) -> Mark:
    return Mark(name, data=data, enc=enc)


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


# Layout helpers
def vconcat(*items: Any) -> Dict[str, Any]:
    return {"vconcat": [encode_value(i) for i in items]}


def hconcat(*items: Any) -> Dict[str, Any]:
    return {"hconcat": [encode_value(i) for i in items]}


def hspace(px: int) -> Dict[str, Any]:
    return {"hspace": px}


def vspace(px: int) -> Dict[str, Any]:
    return {"vspace": px}


# Input helpers
def input(kind: str, **opts: Any) -> Dict[str, Any]:
    payload = {"input": kind}
    payload.update({camelize(k): v for k, v in opts.items() if v is not None})
    return payload


def slider(
    label: str,
    as_: str,
    min: Any = None,
    max: Any = None,
    step: Any = None,
    value: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "slider", label=label, as_=as_, min=min, max=max, step=step, value=value, **opts
    )


def select(
    label: str,
    as_: str,
    options: Any,
    multiple: bool = False,
    value: Any = None,
    **opts: Any,
) -> Dict[str, Any]:
    return input(
        "select",
        label=label,
        as_=as_,
        options=options,
        multiple=multiple,
        value=value,
        **opts,
    )


def checkbox(label: str, as_: str, value: bool = False, **opts: Any) -> Dict[str, Any]:
    return input("checkbox", label=label, as_=as_, value=value, **opts)
