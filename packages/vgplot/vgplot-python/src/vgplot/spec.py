from __future__ import annotations

import inspect
import json
from typing import Any, Dict

from .util import omit_none
from .params import _ParamBase
from .data import DataDef
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


def _collect_datadefs(node: Any) -> list[DataDef]:
    """Recursively collect all DataDef instances in a view tree."""
    if isinstance(node, DataDef):
        return [node]
    if isinstance(node, dict):
        found = []
        for v in node.values():
            found.extend(_collect_datadefs(v))
        return found
    if isinstance(node, list):
        found = []
        for item in node:
            found.extend(_collect_datadefs(item))
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
            {
                "title": self.title,
                "description": self.description,
                "credit": self.credit,
                **self.extra,
            }
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
        data_names: Dict[int, str] | None = None,
        params: Dict[str, Any] | None = None,
        plotDefaults: Dict[str, Any] | None = None,
        config: Dict[str, Any] | None = None,
        view: Dict[str, Any] | None = None,
        **extra: Any,
    ) -> None:
        self.meta = meta.to_dict() if hasattr(meta, "to_dict") else meta
        self.data = data
        self.data_names = data_names or {}
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

        # Second pass: auto-name any _ParamBase in the view not yet registered,
        # skipping names already taken by explicit params.
        used = set(param_names.values()) | set(self.params or {})
        counter = 0
        for obj in _collect_params(self.view):
            if id(obj) not in param_names:
                while f"_param{counter}" in used:
                    counter += 1
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

        # Build data_names lookup and auto-register any unnamed DataDefs in the view
        data_names = dict(self.data_names)
        extra_data: Dict[str, Any] = {}
        used = set(data_names.values()) | set(self.data or {})
        counter = 0
        for obj in _collect_datadefs(self.view):
            if id(obj) not in data_names:
                while f"_data{counter}" in used:
                    counter += 1
                auto_name = f"_data{counter}"
                data_names[id(obj)] = auto_name
                extra_data[auto_name] = obj.to_dict()
                counter += 1
        merged_data = {**(self.data or {}), **extra_data} or None

        base: Dict[str, Any] = {}
        if self.meta:
            base["meta"] = self.meta
        if self.config:
            base["config"] = self.config
        if merged_data:
            base["data"] = merged_data
        if serialized_params:
            base["params"] = serialized_params
        if self.plotDefaults:
            base["plotDefaults"] = self.plotDefaults
        base.update(_encode_component(self.view, param_names, data_names))
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
    caller = inspect.currentframe().f_back
    caller_locals = caller.f_locals

    # Auto-detect meta: prefer a local named "meta", fall back to any Meta instance
    if meta is None:
        candidate = caller_locals.get("meta")
        if isinstance(candidate, Meta):
            meta = candidate
        else:
            for val in caller_locals.values():
                if isinstance(val, Meta):
                    meta = val
                    break

    # Auto-detect view: prefer a local named "view", fall back to any view-keyed dict
    if view is None:
        candidate = caller_locals.get("view")
        if isinstance(candidate, dict) and _VIEW_KEYS.intersection(candidate):
            view = candidate
        else:
            for val in caller_locals.values():
                if isinstance(val, dict) and _VIEW_KEYS.intersection(val):
                    view = val
                    break

    if params is None:
        params = {
            name: val
            for name, val in caller_locals.items()
            if isinstance(val, _ParamBase)
        } or None
    _RESERVED = {"data", "meta", "view"}
    conflicts = _RESERVED.intersection(params or {})
    if conflicts:
        names = ", ".join(f'"{n}"' for n in sorted(conflicts))
        raise ValueError(
            f"Param name(s) {names} conflict with vg.spec() variable names. "
            f"Rename them (e.g. 'data' → 'sample', 'view' → 'layout')."
        )
    # Auto-collect DataDef variables from caller's locals; merge with any
    # explicit data dict (explicit takes precedence on name collision).
    auto_defs = {
        name: val for name, val in caller_locals.items() if isinstance(val, DataDef)
    }
    data_names: Dict[int, str] = {id(val): name for name, val in auto_defs.items()}
    if auto_defs:
        auto_data = {name: val.to_dict() for name, val in auto_defs.items()}
        data = {**auto_data, **(data or {})}
    return Spec(
        meta=meta,
        data=data,
        data_names=data_names,
        params=params,
        plotDefaults=plotDefaults,
        config=config,
        view=view,
        **extra,
    )
