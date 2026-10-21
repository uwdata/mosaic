"""Continuation of anywidget's experimental API.

- https://github.com/manzt/anywidget/blob/443d720b2233fff131a0f0a842b08744c8ffabd6/anywidget/_descriptor.py
- https://anywidget.dev/en/experimental/
"""

from __future__ import annotations

import warnings
from typing import (
    TYPE_CHECKING,
    Any,
    ClassVar,
    Generic,
    Protocol,
    TypeAlias,
    overload,
)
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

from anywidget import _descriptor as experimental
from typing_extensions import TypedDict, TypeVar

if TYPE_CHECKING:
    from collections.abc import Callable

    import psygnal
    import traitlets
    from anywidget._protocols import RequestStateData, UpdateData
    from typing_extensions import Buffer, Self


# TODO @dangotbanned: Replace bound with protocol defining the message shape/send
RequestT = TypeVar("RequestT", infer_variance=True)
ResultT = TypeVar("ResultT", infer_variance=True)


Buffers: TypeAlias = list[memoryview] | list["Buffer"]


class HasSignalGroup(Protocol):
    __slots__ = ()
    events: ClassVar[psygnal.SignalGroupDescriptor]


CanNotify: TypeAlias = "HasSignalGroup | traitlets.HasTraits"
"""The type depended on by [`sync_object_with_view`].

[`sync_object_with_view`]: https://github.com/manzt/anywidget/blob/443d720b2233fff131a0f0a842b08744c8ffabd6/anywidget/_descriptor.py#L527-L544
"""

class Widget(Protocol[RequestT, ResultT]):
    """A widget that handles custom messages."""
    __slots__ = ()

    def _custom_msg(
        self, content: RequestT, buffers: Buffers, /
    ) -> tuple[ResultT, Buffers | None]: ...


class CustomData(TypedDict, Generic[RequestT]):
    method: L["custom"]
    content: RequestT


class JupyterWidgetContent(TypedDict, Generic[RequestT]):
    comm_id: str
    data: UpdateData | RequestStateData | CustomData[RequestT]


class CommMessage(TypedDict, Generic[RequestT]):
    header: dict[Any, Any]
    msg_id: str
    msg_type: str
    parent_header: dict[Any, Any]
    metadata: dict[Any, Any]
    content: JupyterWidgetContent[RequestT]
    buffers: Buffers


def put_buffers(
    state: Any, buffer_paths: list[list[str | int]], buffers: Buffers
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
    def __get__(
        self, instance: Widget[RequestT, ResultT], owner: type
    ) -> ReprMimeBundle[RequestT, ResultT]: ...

    def __get__(
        self, instance: Widget[RequestT, ResultT] | None, owner: type
    ) -> ReprMimeBundle[RequestT, ResultT] | Self:  # ty: ignore[invalid-method-override]
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


class ReprMimeBundle(experimental.ReprMimeBundle, Generic[RequestT, ResultT]):
    if TYPE_CHECKING:
        _obj: Callable[[], Widget[RequestT, ResultT] | None]

        def __init__(
            self,
            obj: Widget[RequestT, ResultT],
            autodetect_observer: bool = True,
            extra_state: dict[str, object] | None = None,
            no_view: bool = False,
        ) -> None: ...

    def send(self, content: ResultT, buffers: Buffers | None = None) -> None:
        comm = self._comm
        if comm.kernel is not None if hasattr(comm, "kernel") else True:
            # NOTE: `buffers: list[bytes] | None` is wrong, impl allows `Collection[Buffer]`
            # https://github.com/jupyter/jupyter_client/blob/978361b3785dcd9cba6c733f4555e833e88fc0df/jupyter_client/session.py#L839-L852
            comm.send({"method": "custom", "content": content}, buffers=buffers)  # ty: ignore[invalid-argument-type]

    def _handle_msg(self, msg: CommMessage[RequestT]) -> None:  # ty: ignore[invalid-method-override]
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

        elif method == "custom":
            if content := data.get("content"):
                result, buffers = obj._custom_msg(content, msg["buffers"])
                self.send(result, buffers)
        else:
            err_msg = f"Unrecognized method: {method}"
            raise ValueError(err_msg)
