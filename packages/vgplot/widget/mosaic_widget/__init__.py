from __future__ import annotations

import inspect
import logging
import pathlib
import time
from typing import TYPE_CHECKING, Protocol

import anywidget
import duckdb
import pyarrow as pa
import traitlets

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

if TYPE_CHECKING:
    from narwhals.typing import IntoFrame


logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

SLOW_QUERY_THRESHOLD = 5000


class SupportsToDict(Protocol):
    def to_dict(self) -> dict: ...


class MosaicWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "index.js"
    _css = pathlib.Path(__file__).parent / "static" / "index.css"

    # The Mosaic specification
    spec = traitlets.Dict({}).tag(sync=True)

    # The current params indexed by name
    params = traitlets.Dict({}).tag(sync=True)

    # Where pre-aggregated materialized views should be created
    preagg_schema = traitlets.Unicode().tag(sync=True)

    def __init__(
        self,
        spec: dict | SupportsToDict | None = None,
        con: duckdb.DuckDBPyConnection | None = None,
        data: dict[str, "IntoFrame"] | None = None,
        *args,
        **kwargs,
    ):
        """Create a Mosaic widget.

        Args:
            spec (dict or object with a to_dict() method, optional): The initial
                Mosaic specification. Defaults to {}.
            con (connection, optional): A DuckDB connection.
                Defaults to duckdb.connect().
            data (dict, optional): DataFrames/Arrow objects to "register" with DuckDB.
                Defaults to {}. Keys are table names, values are objects to register as
                virtual tables (similar to SQL VIEWs). Supports pandas/polars DataFrames
                and other Arrow objects.
        """
        if data is None:
            data = {}
        if spec is None:
            spec = {}
        elif not isinstance(spec, dict):
            to_dict = getattr(spec, "to_dict", None)
            if not callable(to_dict):
                raise TypeError(
                    f"spec must be a dict or have a to_dict() method, got {type(spec)}"
                )
            frame = inspect.currentframe()
            caller_locals = frame.f_back.f_locals if frame and frame.f_back else {}
            try:
                spec = to_dict(_context=caller_locals)
            except TypeError:
                spec = to_dict()
        if con is None:
            con = duckdb.connect()

        super().__init__(*args, **kwargs)
        self.spec = spec
        self.con = con
        for name, df in data.items():
            self.con.register(name, frame_to_duckdb_registrable(df))
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, content: dict, buffers: list) -> None:
        logger.debug(f"{content=}, {buffers=}")
        start = time.time()

        uuid = content["uuid"]
        sql = content["sql"]
        command = content["type"]

        try:
            if command == "arrow":
                result = self.con.query(sql).arrow()
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, result.schema) as writer:
                    for batch in result:
                        writer.write(batch)
                buf = sink.getvalue()

                self.send({"type": "arrow", "uuid": uuid}, buffers=[buf.to_pybytes()])
            elif command == "exec":
                self.con.execute(sql)
                self.send({"type": "exec", "uuid": uuid})
            elif command == "json":
                result = self.con.query(sql).df()
                json = result.to_dict(orient="records")
                self.send({"type": "json", "uuid": uuid, "result": json})
            else:
                raise ValueError(f"Unknown command {command}")
        except Exception as e:
            logger.exception("Error processing query")
            self.send({"error": str(e), "uuid": uuid})

        total = round((time.time() - start) * 1_000)
        if total > SLOW_QUERY_THRESHOLD:
            logger.warning(f"DONE. Slow query {uuid} took {total} ms.\n{sql}")
        else:
            logger.info(f"DONE. Query {uuid} took {total} ms.\n{sql}")
