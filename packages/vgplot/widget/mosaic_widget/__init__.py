from __future__ import annotations

import logging
import pathlib
import time

import anywidget
import duckdb
import narwhals as nw
import pyarrow as pa
import traitlets

from narwhals.typing import Frame

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

SLOW_QUERY_THRESHOLD = 5000


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
        spec: dict | None = None,
        con: duckdb.DuckDBPyConnection | None = None,
        data: dict[str, Frame] | None = None,
        *args,
        **kwargs,
    ):
        """Create a Mosaic widget.

        Args:
            spec (dict, optional): The initial Mosaic specification. Defaults to {}.
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
        if con is None:
            con = duckdb.connect()

        super().__init__(*args, **kwargs)
        self.spec = spec
        self.con = con
        for name, df in data.items():
            self.con.register(name, _frame_to_duckdb_registrable(df))
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data: dict, buffers: list):
        logger.debug(f"{data=}, {buffers=}")
        start = time.time()

        uuid = data["uuid"]
        sql = data["sql"]
        command = data["type"]

        try:
            if command == "arrow":
                result = self.con.query(sql).arrow()
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, result.schema) as writer:
                    writer.write(result)
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


def _is_frame_native_to_duckdb(frame: Frame) -> bool:
    """Check if a frame is natively supported by DuckDB to be registered as a virtual table with zero-copy guarantees."""

    # "<class '{module_path}'>" -> "{module_path}" via slicing
    module_path = str(type(frame))[8:-2]
    frame_backend = module_path.split(".")[0]
    backends_with_native_virtual_table_support = {"pandas", "polars", "pyarrow"}
    return frame_backend in backends_with_native_virtual_table_support


def _frame_to_duckdb_registrable(frame: Frame) -> object:
    """Converts a native dataframe(-like) object to a DuckDB-registrable object.

    If the passed `frame` is one of the backends supported by DuckDB to be registered as a virtual table with zero-copy guarantees,
    we return the `frame` itself. Otherwise, we convert it to a Narwhals frame and then to an Arrow table. Based on the backend-specific implementation,
    this may or may not be a zero-copy operation.

    If the passed `frame` is a lazy frame, it is materialized.
    """
    if _is_frame_native_to_duckdb(frame):
        return frame

    # If frame is not natively registrable to DuckDB, we convert it to an Arrow table via Narwhals.
    # Based on the backend-specific implementation, this may or may not be zero-copy.
    nw_frame = nw.from_native(frame)
    logger.warning(
        f"Converting {type(frame)} to Arrow table for DuckDB registration. This may not be a zero-copy operation."
    )

    # Some backends like Ibis, PySpark, etc. have lazy-only Narwhals support, so we must materialize them
    if isinstance(nw_frame, nw.LazyFrame):
        logger.warning("Materializing lazy frame")
        nw_frame = nw_frame.collect()

    return nw_frame.to_arrow()
