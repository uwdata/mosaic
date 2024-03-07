from __future__ import annotations

import logging
import pathlib
import time

import anywidget
import duckdb
import pyarrow as pa
import traitlets

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

_DEV = False  # switch to False for production

SLOW_QUERY_THRESHOLD = 5000

if _DEV:
    # from `npm run dev`
    ESM = "http://localhost:5173/src/index.js?anywidget"
    CSS = ""
else:
    # from `npm run build`
    bundled_assets_dir = pathlib.Path(__file__).parent / "static"
    ESM = bundled_assets_dir / "index.js"
    CSS = bundled_assets_dir / "style.css"


class MosaicWidget(anywidget.AnyWidget):
    _esm = ESM
    _css = CSS

    # The Mosaic specification
    spec = traitlets.Dict({}).tag(sync=True)

    # The current params indexed by name
    params = traitlets.Dict({}).tag(sync=True)

    # Whether data cube indexes should be created as temp tables
    temp_indexes = traitlets.Bool().tag(sync=True)

    def __init__(
        self,
        spec: dict | None = None,
        con=None,
        temp_indexes=True,
        data=None,
        *args,
        **kwargs,
    ):
        """Create a Mosaic widget.

        Args:
            spec (dict, optional): The initial Mosaic specification. Defaults to {}.
            con (connection, optional): A DuckDB connection.
                Defaults to duckdb.connect().
            temp_indexes (bool, optional): Whether data cube indexes should be
                created as temp tables tables. Defaults to True.
            data (dict, optional): Pandas DataFrames to add to DuckDB.
                The keys are used as the names of the tables. Defaults to {}.
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
        self.temp_indexes = temp_indexes
        for name, df in data.items():
            self.con.register(name, df)
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
            logger.warning(f"DONE. Slow query { uuid } took { total } ms.\n{ sql }")
        else:
            logger.info(f"DONE. Query { uuid } took { total } ms.\n{ sql }")
