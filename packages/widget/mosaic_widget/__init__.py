import duckdb
import anywidget
import traitlets
import pyarrow as pa
import pathlib

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

    spec = traitlets.Dict({}).tag(sync=True)
    conn = None

    def __init__(self, spec: dict, con=duckdb.connect(), *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spec = spec
        self.con = con
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, data: dict, buffers: list):
        print(f"{data=}, {buffers=}")

        queryId = data["queryId"]

        if data["type"] == "arrow":
            result = self.con.execute(data["sql"]).arrow()
            sink = pa.BufferOutputStream()
            with pa.ipc.new_stream(sink, result.schema) as writer:
                writer.write(result)
            buf = sink.getvalue()

            self.send({"type": "arrow", "queryId": queryId}, buffers=[buf.to_pybytes()])
        elif data["type"] == "exec":
            self.con.execute(data["sql"]).fetchall()
            self.send({"type": "exec", "queryId": queryId})
        else:
            result = self.con.execute(data["sql"]).df()
            json = result.to_dict(orient="records")
            self.send({"type": "json", "queryId": queryId, "result": json})
