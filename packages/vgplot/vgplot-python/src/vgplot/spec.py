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


class Spec:
    def __init__(
        self,
        *,
        data: Dict[str, Any] | None = None,
        data_names: Dict[int, str] | None = None,
        params: Dict[str, Any] | None = None,
        plotDefaults: Dict[str, Any] | None = None,
        plot_defaults: Dict[str, Any] | None = None,
        config: Dict[str, Any] | None = None,
        view: Dict[str, Any] | None = None,
        **extra: Any,
    ) -> None:
        # Serialize any DataDef values in data and build id→name mapping
        resolved_data: Dict[str, Any] = {}
        resolved_data_names: Dict[int, str] = dict(data_names or {})
        for name, val in (data or {}).items():
            if isinstance(val, DataDef):
                resolved_data_names[id(val)] = name
                resolved_data[name] = val.to_dict()
            else:
                resolved_data[name] = val
        self.data = resolved_data or None
        self.data_names = resolved_data_names
        self.params = params
        self.plotDefaults = plotDefaults or plot_defaults
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
        view_params = {id(obj): obj for obj in _collect_params(self.view)}
        all_params = dict(self.params or {})
        for obj_id, name in param_names.items():
            if name not in all_params and obj_id in view_params:
                all_params[name] = view_params[obj_id]
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


class View:
    """
    A composable view returned by plot(), vconcat(), hconcat() etc.
    Behaves like Spec but discovers data and params from the caller's
    frame at display/export time rather than at construction time.
    """

    def __init__(
        self,
        view: Dict[str, Any],
        *,
        data: Dict[str, Any] | None = None,
        plotDefaults: Dict[str, Any] | None = None,
        plot_defaults: Dict[str, Any] | None = None,
        config: Dict[str, Any] | None = None,
        **extra: Any,
    ) -> None:
        self._view = view
        self._data = data  # explicit overrides for renamed data variables
        self._plotDefaults = plotDefaults or plot_defaults
        self._config = config
        self._extra = extra

    def _build_spec(self, caller_locals: Dict[str, Any]) -> Spec:
        explicit_ids = {
            id(v) for v in (self._data or {}).values() if isinstance(v, DataDef)
        }
        frame_data: Dict[str, Any] = {
            name: obj
            for name, obj in caller_locals.items()
            if isinstance(obj, DataDef)
            and not name.startswith("_")
            and id(obj) not in explicit_ids
        }
        merged_data = {**(self._data or {}), **frame_data} or None
        frame_params: Dict[str, Any] = {
            name: obj
            for name, obj in caller_locals.items()
            if isinstance(obj, _ParamBase) and not name.startswith("_")
        }
        return Spec(
            data=merged_data,
            params=frame_params or None,
            plotDefaults=self._plotDefaults,
            config=self._config,
            view=self._view,
            **self._extra,
        )

    def to_dict(self, _context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        locals_ = (
            _context if _context is not None else inspect.currentframe().f_back.f_locals
        )  # type: ignore[union-attr]
        return self._build_spec(locals_).to_dict()

    def to_json(self, _context: Dict[str, Any] | None = None, **kwargs: Any) -> str:
        locals_ = (
            _context if _context is not None else inspect.currentframe().f_back.f_locals
        )  # type: ignore[union-attr]
        return self._build_spec(locals_).to_json(**kwargs)

    def show(self, con: Any = None, data: Any = None) -> None:
        caller_locals = inspect.currentframe().f_back.f_locals  # type: ignore[union-attr]
        self._build_spec(caller_locals).show(con=con, data=data)

    def _repr_mimebundle_(self, **kwargs: Any):
        # Walk up frames to find the one where this View object lives
        frame = inspect.currentframe().f_back
        while frame is not None:
            if any(v is self for v in frame.f_locals.values()):
                break
            frame = frame.f_back
        locals_ = frame.f_locals if frame is not None else {}
        return self._build_spec(locals_)._repr_mimebundle_(**kwargs)


_VIEW_KEYS = {"plot", "vconcat", "hconcat", "hspace", "vspace", "input"}


def spec(
    *args: Any,
    data: Dict[str, Any] | None = None,
    params: Dict[str, Any] | None = None,
    plotDefaults: Dict[str, Any] | None = None,
    plot_defaults: Dict[str, Any] | None = None,
    config: Dict[str, Any] | None = None,
    view: Dict[str, Any] | None = None,
    **extra: Any,
) -> Spec:
    for arg in args:
        if isinstance(arg, dict) and _VIEW_KEYS.intersection(arg):
            view = arg
        elif isinstance(arg, dict):
            data = arg

    # Inspect caller frame to discover DataDef and _ParamBase objects by variable name.
    caller_locals = inspect.currentframe().f_back.f_locals  # type: ignore[union-attr]

    # Collect DataDef objects not already covered by the explicit data= argument.
    explicit_ids = {id(v) for v in (data or {}).values() if isinstance(v, DataDef)}
    frame_data: Dict[str, Any] = {
        name: obj
        for name, obj in caller_locals.items()
        if isinstance(obj, DataDef)
        and not name.startswith("_")
        and id(obj) not in explicit_ids
    }
    merged_data = {**(data or {}), **frame_data} or None

    # Collect _ParamBase objects when params were not passed explicitly.
    if params is None:
        frame_params: Dict[str, Any] = {
            name: obj
            for name, obj in caller_locals.items()
            if isinstance(obj, _ParamBase) and not name.startswith("_")
        }
        params = frame_params or None

    return Spec(
        data=merged_data,
        params=params,
        plotDefaults=plotDefaults,
        plot_defaults=plot_defaults,
        config=config,
        view=view,
        **extra,
    )
