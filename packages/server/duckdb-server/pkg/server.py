from __future__ import annotations

import logging
import sys
import time
from typing import TYPE_CHECKING, Any, Literal, Protocol, TypedDict

import msgspec
from socketify import App, CompressOptions, OpCode

from pkg.query import get_arrow_bytes

if TYPE_CHECKING:
    import duckdb
    from duckdb import DuckDBPyConnection as Con
    from socketify import Request as Req
    from socketify import Response as Res
    from socketify import SendStatus as Status
    from socketify import WebSocket as Ws

logger = logging.getLogger(__name__)

SLOW_QUERY_THRESHOLD = 5000


class _QueryParams(TypedDict):
    type: Literal["arrow", "exec"]
    sql: str


query_decoder = msgspec.json.Decoder(_QueryParams)


class Handler(Protocol):
    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...
    def error(self, error: Any, status: int = 500) -> None: ...


class SocketHandler(Handler):
    def __init__(self, ws: Ws) -> None:
        self.ws: Ws = ws

    def check(self, ok: Ws | Status | None) -> None:
        if not ok:
            logger.warning(f"WebSocket backpressure: {self.ws.get_buffered_amount()}")

    def done(self) -> None:
        ok = self.ws.send({}, OpCode.TEXT)
        self.check(ok)

    def arrow(self, buffer: bytes) -> None:
        ok = self.ws.send(buffer, OpCode.BINARY)
        self.check(ok)

    def error(self, error: object, status: int = 500) -> None:
        ok = self.ws.send({"error": str(error)}, OpCode.TEXT)
        self.check(ok)


class HTTPHandler(Handler):
    def __init__(self, res: Res) -> None:
        self.res = res

    def done(self) -> None:
        self.res.end("")

    def arrow(self, buffer: bytes) -> None:
        self.res.write_header("Content-Type", "application/octet-stream")
        self.res.end(buffer)

    def error(self, error: object, status: int = 500) -> None:
        self.res.write_status(status)
        self.res.end(str(error))


def handle_message(
    handler: Handler,
    con: duckdb.DuckDBPyConnection,
    message: str | bytes | bytearray,
) -> None:
    try:
        query = query_decoder.decode(message)
    except msgspec.DecodeError as e:
        handler.error(e, 400)
        return

    handle_query(handler, con, query)


def handle_query(
    handler: Handler,
    con: duckdb.DuckDBPyConnection,
    query: _QueryParams,
) -> None:
    logger.debug(f"{query=}")

    start = time.time()

    sql = query["sql"]

    try:
        match query["type"]:
            case "exec":
                con.execute(sql)
                handler.done()
            case "arrow":
                buffer = get_arrow_bytes(con, sql)
                handler.arrow(buffer)
    except Exception as e:
        logger.exception("Error processing query")
        handler.error(e)

    total = round((time.time() - start) * 1_000)
    if total > SLOW_QUERY_THRESHOLD:
        logger.warning(f"DONE. Slow query took {total} ms.\n{sql}")
    else:
        logger.info(f"DONE. Query took {total} ms.\n{sql}")


def on_error(error: object, res: Res, req: Req) -> None:
    logger.error(str(error))
    if res is not None:
        res.write_status(500)
        res.end(f"Error {error}")


def server(con: Con) -> None:
    # SSL server
    # app = App(AppOptions(key_file_name="./localhost-key.pem", cert_file_name="./localhost.pem"))
    app = App()

    def ws_message(ws: Ws, message: str | bytes | bytearray, opcode: OpCode) -> None:
        handle_message(SocketHandler(ws), con, message)

    async def http_handler(res: Res, req: Req) -> None:
        res.write_header("Access-Control-Allow-Origin", "*")
        res.write_header("Access-Control-Request-Method", "*")
        res.write_header("Access-Control-Allow-Methods", "OPTIONS, POST, GET")
        res.write_header("Access-Control-Allow-Headers", "*")
        res.write_header("Access-Control-Max-Age", "2592000")

        method = req.get_method()

        handler = HTTPHandler(res)
        if method == "OPTIONS":
            handler.done()
        elif method == "GET":
            handle_message(handler, con, req.get_query("query"))
        elif method == "POST":
            body = await res.get_data()
            handle_message(handler, con, body.getvalue())

    app.ws(
        "/*",
        {
            "compression": CompressOptions.SHARED_COMPRESSOR,
            "message": ws_message,
            "drain": lambda ws: logger.warning(
                f"WebSocket backpressure: {ws.get_buffered_amount()}"
            ),
        },
    )

    app.any("/", http_handler)

    app.set_error_handler(on_error)

    app.listen(
        3000,
        lambda config: sys.stdout.write(
            f"DuckDB Server listening at ws://localhost:{config.port} and http://localhost:{config.port}\n"
        ),
    )
    app.run()
