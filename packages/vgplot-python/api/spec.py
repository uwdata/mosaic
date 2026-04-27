from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .util import omit_none
from .params import _ParamBase
from .plot import _encode_component


@dataclass
class Meta:
    title: Optional[str] = None
    description: Optional[str] = None
    credit: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return omit_none(
            {
                "title": self.title,
                "description": self.description,
                "credit": self.credit,
            }
        )


def meta(
    title: str | None = None, description: str | None = None, credit: str | None = None
) -> Meta:
    return Meta(title=title, description=description, credit=credit)


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
        # First pass: register all param objects so nested refs can resolve
        for name, p in (self.params or {}).items():
            if isinstance(p, _ParamBase):
                param_names[id(p)] = name

        # Second pass: serialize with cross-references resolved
        for name, p in (self.params or {}).items():
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

    def show(self, con=None, data=None):
        try:
            from mosaic_widget import MosaicWidget
        except ImportError as e:
            raise ImportError("pip install mosaic-widget") from e
        try:
            from IPython.display import display
        except ImportError as e:
            raise ImportError("IPython is required for display") from e
        widget = MosaicWidget(self.to_dict(), con=con, data=data)
        display(widget)


def spec(
    *,
    meta: Meta | Dict[str, Any] | None = None,
    data: Dict[str, Any] | None = None,
    params: Dict[str, Any] | None = None,
    plotDefaults: Dict[str, Any] | None = None,
    config: Dict[str, Any] | None = None,
    view: Dict[str, Any] | None = None,
    **extra: Any,
) -> Spec:
    return Spec(
        meta=meta,
        data=data,
        params=params,
        plotDefaults=plotDefaults,
        config=config,
        view=view,
        **extra,
    )
