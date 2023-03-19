import duckdb
import anywidget
import traitlets
import pyarrow as pa
import pathlib
import time
import logging

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

_DEV = False  # switch to False for production

if _DEV:
    # from `npm run dev`
    ESM = "http://localhost:5173/src/index.js?anywidget"
    CSS = ""
else:
    # from `npm run build`
    bundled_assets_dir = pathlib.Path(__file__).parent / "static"
    ESM = (bundled_assets_dir / "index.mjs").read_text()
    CSS = (bundled_assets_dir / "style.css").read_text()


class MosaicWidget(anywidget.AnyWidget):
    _esm = ESM
    _css = CSS

    # The Mosaic specification
    spec = traitlets.Dict({}).tag(sync=True)

    # The current selections
    selections = traitlets.List([]).tag(sync=True)

    def __init__(self, spec: dict = {}, con=duckdb.connect(), data={}, *args, **kwargs):
        """Create a Mosaic widget.

        Args:
            spec (dict, optional): The initial Mosaic specification. Defaults to {}.
            con (connection, optional): A DuckDB connection.
                Defaults to duckdb.connect().
            data (dict, optional): Pandas DataFrames to add to DuckDB.
                The keys are used as the names of the tables. Defaults to {}.
        """
        super().__init__(*args, **kwargs)
        self.spec = spec
        self.con = con
        for name, df in data.items():
            self.con.register(name, df)
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data: dict, buffers: list):
        logger.debug(f"{data=}, {buffers=}")
        start = time.time()

        uuid = data["uuid"]
        sql = data["sql"]

        try:
            if data["type"] == "arrow":
                result = self.con.query(sql).arrow()
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, result.schema) as writer:
                    writer.write(result)
                buf = sink.getvalue()

                self.send({"type": "arrow", "uuid": uuid}, buffers=[buf.to_pybytes()])
            elif data["type"] == "exec":
                self.con.execute(sql)
                self.send({"type": "exec", "uuid": uuid})
            else:
                result = self.con.query(sql).df()
                json = result.to_dict(orient="records")
                self.send({"type": "json", "uuid": uuid, "result": json})
        except Exception as e:
            logger.error(e)
            self.send({"error": str(e), "uuid": uuid})

        total = round((time.time() - start) * 1_000)
        if total > 5000:
            logger.warning(f"DONE. Slow query { uuid } took { total } ms.\n{ sql }")
        else:
            logger.info(f"DONE. Query { uuid } took { total } ms.\n{ sql }")
