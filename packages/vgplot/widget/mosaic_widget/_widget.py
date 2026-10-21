from __future__ import annotations

import logging
import warnings
from collections.abc import Callable, Mapping
from pathlib import Path
from typing import TYPE_CHECKING, Any, TypeAlias, TypedDict, overload
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import pyarrow as pa
from anywidget import _descriptor as experimental

from mosaic_widget import _db

if TYPE_CHECKING:
    import duckdb
    from anywidget._protocols import RequestStateData, UpdateData
    from typing_extensions import NotRequired


class Param(TypedDict):
    value: object
    predicate: NotRequired[str]


Spec: TypeAlias = Mapping[str, Mapping[str, Any]]


class QueryParams(TypedDict):
    type: L["arrow", "exec"]
    sql: str
    uuid: str


class QueryError(TypedDict):
    error: str
    uuid: str


class QueryResult(TypedDict):
    type: L["arrow", "exec"]
    uuid: str


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


_STATIC_DIR = Path(__file__).parent / "static"
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


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
    def __get__(self, instance: None, owner: type) -> MimeBundleDescriptor: ...

    @overload
    def __get__(self, instance: object, owner: type) -> ReprMimeBundle: ...

    def __get__(
        self, instance: object | None, owner: type
    ) -> ReprMimeBundle | MimeBundleDescriptor:
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


class ReprMimeBundle(experimental.ReprMimeBundle):
    _obj: Callable[[], MosaicWidget | None]

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
                    result, buffers = obj._run_command(content)
                except Exception as e:
                    self.send({"error": str(e), "uuid": content["uuid"]})
                    raise
                self.send(result, buffers)
        else:
            err_msg = f"Unrecognized method: {method}"
            raise ValueError(err_msg)


class MosaicWidget:
    # NOTE: if adding `__slots__`, it'll need a `'__weakref__'` slot
    _repr_mimebundle_ = MimeBundleDescriptor(
        _esm=_STATIC_DIR / "index.js", _css=_STATIC_DIR / "index.css"
    )

    # not mutated in python
    spec: Spec
    # set in js
    params: Mapping[str, Param]
    # not ref'd in python
    preagg_schema: str

    _registered_tables: set[str]
    con: duckdb.DuckDBPyConnection

    def __init__(
        self,
        spec: dict[str, Any] | None = None,
        con: duckdb.DuckDBPyConnection | None = None,
    ) -> None:
        self.spec = spec or {}
        self.params = {}
        self.preagg_schema = ""
        self._registered_tables = set[str]()
        self.con = _db.connect(con)

    def _get_anywidget_state(self, include: set[str] | None) -> dict[str, Any]:
        if include:
            return {k: getattr(self, k) for k in include}
        return {
            "spec": self.spec,
            "params": self.params,
            "preagg_schema": self.preagg_schema,
        }

    def _run_command(
        self, content: QueryParams
    ) -> tuple[QueryResult, list[Any] | None]:
        logger.debug("content=%s", content)
        uuid = content["uuid"]
        sql = content["sql"]
        command = content["type"]

        if command == "arrow":
            result = self.con.query(sql).arrow()
            sink = pa.BufferOutputStream()
            with pa.ipc.new_stream(sink, result.schema) as writer:
                for batch in result:
                    writer.write(batch)
            return {"type": "arrow", "uuid": uuid}, [sink.getvalue().to_pybytes()]

        elif command == "exec":
            self.con.execute(sql)
            return {"type": "exec", "uuid": uuid}, None

        else:
            msg = f"Unknown command {command}"
            raise ValueError(msg)


widget = MosaicWidget()
widget._repr_mimebundle_()
