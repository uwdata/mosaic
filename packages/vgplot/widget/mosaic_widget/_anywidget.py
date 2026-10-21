"""Continuation of anywidget's experimental API.

- https://github.com/manzt/anywidget/blob/443d720b2233fff131a0f0a842b08744c8ffabd6/anywidget/_descriptor.py
- https://anywidget.dev/en/experimental/
"""

from __future__ import annotations

import warnings
from typing import TYPE_CHECKING, Any, Generic, TypedDict, TypeVar, overload
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

from anywidget import _descriptor as experimental

if TYPE_CHECKING:
    from collections.abc import Callable

    from anywidget._protocols import RequestStateData, UpdateData
    from typing_extensions import Self

    from mosaic_widget._widget import MosaicWidget
    from mosaic_widget.typing import QueryError, QueryParams, QueryResult


# TODO @dangotbanned: Replace bound with protocol defining the message shape/send
WidgetT = TypeVar("WidgetT", bound="MosaicWidget")


# TODO @dangotbanned: Make generic using `typing_extensions.TypedDict`
# - `CustomData`, `JupyterWidgetContent`, `CommMessage`
class CustomData(TypedDict):
    method: L["custom"]
    content: QueryParams


class JupyterWidgetContent(TypedDict):
    comm_id: str
    data: UpdateData | RequestStateData | CustomData


class CommMessage(TypedDict):
    header: dict[Any, Any]
    msg_id: str
    msg_type: str
    parent_header: dict[Any, Any]
    metadata: dict[Any, Any]
    content: JupyterWidgetContent
    buffers: list[memoryview]


def put_buffers(
    state: Any, buffer_paths: list[list[str | int]], buffers: list[memoryview]
) -> None:
    for buffer_path, buffer in zip(buffer_paths, buffers, strict=False):
        obj = state
        for key in buffer_path[:-1]:
            obj = obj[key]
        obj[buffer_path[-1]] = buffer


class MimeBundleDescriptor(experimental.MimeBundleDescriptor):
    @overload
    def __get__(self, instance: None, owner: type) -> Self: ...

    @overload
    def __get__(self, instance: WidgetT, owner: type) -> ReprMimeBundle[WidgetT]: ...

    def __get__(
        self, instance: WidgetT | None, owner: type
    ) -> ReprMimeBundle[WidgetT] | Self:  # ty: ignore[invalid-method-override]
        if instance is None:
            return self
        try:
            repr_obj = ReprMimeBundle(
                instance,
                autodetect_observer=self._autodetect_observer,
                extra_state=self._extra_state,
                no_view=self._no_view,
            )
            if self._follow_changes:
                # TODO @dangotbanned: Fix UserWarning: Could not find a notifier on <__main__.MosaicWidget object at 0x0000018747E25160> (e.g. psygnal, traitlets).
                # Changes to the python object will not be reflected in the JS view
                repr_obj.sync_object_with_view()
        except Exception as e:
            warnings.warn(f"Error in Anywidget repr:\n{e}", stacklevel=1)
            raise

        setattr(instance, self._name, repr_obj)
        return repr_obj


class ReprMimeBundle(experimental.ReprMimeBundle, Generic[WidgetT]):
    if TYPE_CHECKING:
        _obj: Callable[[], WidgetT | None]

        def __init__(
            self,
            obj: WidgetT,
            autodetect_observer: bool = True,
            extra_state: dict[str, object] | None = None,
            no_view: bool = False,
        ) -> None: ...

    # TODO @dangotbanned: `content` may need to depend on `WidgetT` or relax it
    def send(self, content: QueryResult | QueryError, buffers: Any = None) -> None:
        comm = self._comm
        if comm.kernel is not None if hasattr(comm, "kernel") else True:
            comm.send({"method": "custom", "content": content}, buffers=buffers)

    def _handle_msg(self, msg: CommMessage) -> None:  # ty: ignore[invalid-method-override]
        obj = self._obj()
        if obj is None:
            return

        data = msg["content"]["data"]
        method = data["method"]
        if data["method"] == "update":
            if state := data.get("state"):
                if "buffer_paths" in data:
                    put_buffers(state, data["buffer_paths"], msg["buffers"])
                self._set_state(obj, state)

        elif data["method"] == "request_state":
            self.send_state()

        # Handle a custom msg from the front-end.
        elif method == "custom":
            if content := data.get("content"):
                try:
                    # TODO @dangotbanned: Replace `_run_command` with something more general
                    # Won't be `_handle_custom_msg`, as I want a return value to bound a protocol
                    result, buffers = obj._run_command(content)
                except Exception as e:
                    self.send({"error": str(e), "uuid": content["uuid"]})
                    raise
                self.send(result, buffers)
        else:
            err_msg = f"Unrecognized method: {method}"
            raise ValueError(err_msg)
