from __future__ import annotations

import inspect
import json
from typing import Any, Dict

from .util import omit_none
from .params import _ParamBase
from .plot import _encode_component


def _collect_params(node: Any) -> list[_ParamBase]:
    """Recursively collect all _ParamBase instances in a view tree."""
    if isinstance(node, _ParamBase):
        return [node]
    if isinstance(node, dict):
        found = []
        for v in node.values():
            found.extend(_collect_params(v))
        return found
    if isinstance(node, list):
        found = []
        for item in node:
            found.extend(_collect_params(item))
        return found
    return []


class Meta:
    def __init__(
        self,
        title: str | None = None,
        description: str | None = None,
        credit: str | None = None,
        **extra: Any,
    ) -> None:
        self.title = title
        self.description = description
        self.credit = credit
        self.extra = extra

    def to_dict(self) -> Dict[str, Any]:
        return omit_none(
            {"title": self.title, "description": self.description, "credit": self.credit, **self.extra}
        )


def meta(
    title: str | None = None,
    description: str | None = None,
    credit: str | None = None,
    **extra: Any,
) -> Meta:
    return Meta(title=title, description=description, credit=credit, **extra)


class Spec:
    def __init__(
        self,
        *,
        meta: Meta | Dict[str, Any] | None = None,
        data: Dict[str, Any] | None = None,
        params: Dict[str, Any] | None = None,
        plotDefaults: Dict[str, Any] | None = None,
        config: Dict[str, Any] | None = None,
        view: Dict[str, Any] | None = None,
        **extra: Any,
    ) -> None:
        self.meta = meta.to_dict() if hasattr(meta, "to_dict") else meta
        self.data = data
        self.params = params
        self.plotDefaults = plotDefaults
        self.config = config
        self.view = view or {}
        self.extra = extra

    def to_dict(self) -> Dict[str, Any]:
        # Build a reverse lookup: id(param_object) -> param_name, so that
        # _ParamBase instances appearing in the view resolve to "$name" refs.
        param_names: Dict[int, str] = {}
        serialized_params: Dict[str, Any] = {}
        # First pass: register all named params
        for name, p in (self.params or {}).items():
            if isinstance(p, _ParamBase):
                param_names[id(p)] = name

        # Second pass: auto-name any _ParamBase in the view not yet registered
        counter = 0
        for obj in _collect_params(self.view):
            if id(obj) not in param_names:
                param_names[id(obj)] = f"_param{counter}"
                counter += 1

        # Third pass: serialize all known params
        all_params = dict(self.params or {})
        for obj_id, name in param_names.items():
            if name not in all_params:
                # find the object to serialize it
                for obj in _collect_params(self.view):
                    if id(obj) == obj_id:
                        all_params[name] = obj
                        break
        for name, p in all_params.items():
            if isinstance(p, _ParamBase):
                serialized_params[name] = p.param_def(param_names=param_names)
            else:
                serialized_params[name] = p

        base: Dict[str, Any] = {}
        if self.meta:
            base["meta"] = self.meta
        if self.config:
            base["config"] = self.config
        if self.data:
            base["data"] = self.data
        if serialized_params:
            base["params"] = serialized_params
        if self.plotDefaults:
            base["plotDefaults"] = self.plotDefaults
        base.update(_encode_component(self.view, param_names))
        base.update(omit_none(self.extra))
        return base

    def to_json(self, **kwargs: Any) -> str:
        return json.dumps(self.to_dict(), **kwargs)

    def _repr_mimebundle_(self, **kwargs):
        try:
            from mosaic_widget import MosaicWidget
        except ImportError:
            return {"text/plain": repr(self)}
        widget = MosaicWidget(self.to_dict())
        return widget._repr_mimebundle_(**kwargs)

    def show(self, con=None, data=None):
        try:
            from mosaic_widget import MosaicWidget
            from IPython.display import display
        except ImportError as e:
            raise ImportError("pip install mosaic-widget") from e
        widget = MosaicWidget(self.to_dict(), con=con, data=data)
        display(widget)


_VIEW_KEYS = {"plot", "vconcat", "hconcat", "hspace", "vspace", "input"}


def spec(
    *args: Any,
    meta: Meta | Dict[str, Any] | None = None,
    data: Dict[str, Any] | None = None,
    params: Dict[str, Any] | None = None,
    plotDefaults: Dict[str, Any] | None = None,
    config: Dict[str, Any] | None = None,
    view: Dict[str, Any] | None = None,
    **extra: Any,
) -> Spec:
    for arg in args:
        if isinstance(arg, Meta):
            meta = arg
        elif isinstance(arg, dict) and _VIEW_KEYS.intersection(arg):
            view = arg
        elif isinstance(arg, dict):
            data = arg
    if params is None:
        caller = inspect.currentframe().f_back
        params = {
            name: val
            for name, val in caller.f_locals.items()
            if isinstance(val, _ParamBase)
        } or None
    return Spec(
        meta=meta,
        data=data,
        params=params,
        plotDefaults=plotDefaults,
        config=config,
        view=view,
        **extra,
    )
