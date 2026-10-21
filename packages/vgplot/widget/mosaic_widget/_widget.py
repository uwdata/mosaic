from __future__ import annotations

import logging
from pathlib import Path
from typing import TYPE_CHECKING, Any

import pyarrow as pa

from mosaic_widget import _db
from mosaic_widget._anywidget import MimeBundleDescriptor

if TYPE_CHECKING:
    from collections.abc import Mapping

    import duckdb

    from mosaic_widget._anywidget import Buffers
    from mosaic_widget.typing import Param, QueryParams, QueryResult, Spec


_STATIC_DIR = Path(__file__).parent / "static"
logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


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

    def _custom_msg(
        self, content: QueryParams, buffers: Buffers | None = None
    ) -> tuple[QueryResult, Buffers | None]:
        logger.debug("content=%s", content)
        uuid = content["uuid"]
        sql = content["sql"]
        command = content["type"]

        try:
            if command == "arrow":
                result = self.con.query(sql).to_arrow_reader()
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, result.schema) as writer:
                    for batch in result:
                        writer.write_batch(batch)
                return {"type": "arrow", "uuid": uuid}, [sink.getvalue().to_pybytes()]

            elif command == "exec":
                self.con.execute(sql)
                return {"type": "exec", "uuid": uuid}, None

            else:
                msg = f"Unknown command {command}"
                raise ValueError(msg)
        except Exception as e:
            self._repr_mimebundle_.send({"error": str(e), "uuid": uuid})
            raise


widget = MosaicWidget()
widget._repr_mimebundle_()
