from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional

from .util import omit_none


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
        base: Dict[str, Any] = {}
        if self.meta:
            base["meta"] = self.meta
        if self.config:
            base["config"] = self.config
        if self.data:
            base["data"] = self.data
        if self.params:
            base["params"] = self.params
        if self.plotDefaults:
            base["plotDefaults"] = self.plotDefaults
        base.update(self.view)
        base.update(omit_none(self.extra))
        return base

    def to_json(self, **kwargs: Any) -> str:
        return json.dumps(self.to_dict(), **kwargs)


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
