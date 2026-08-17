from __future__ import annotations

import logging
import sys
import time
from functools import partial
from typing import TYPE_CHECKING, Any, Protocol

import ujson
from socketify import App, CompressOptions, OpCode

from pkg.query import get_arrow_bytes, get_json, retrieve

if TYPE_CHECKING:
    import duckdb
    from diskcache import Cache
    from duckdb import DuckDBPyConnection as Con
    from socketify import Request as Req
    from socketify import Response as Res
    from socketify import SendStatus as Status
    from socketify import WebSocket as Ws

    from pkg.query import _QueryParams

logger = logging.getLogger(__name__)

SLOW_QUERY_THRESHOLD = 5000


class Handler(Protocol):
    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...
    def json(self, data: Any) -> None: ...
    def error(self, error: Any) -> None: ...


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

    def json(self, data: Any) -> None:
        ok = self.ws.send(data, OpCode.TEXT)
        self.check(ok)

    def error(self, error: object) -> None:
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

    def json(self, data: Any) -> None:
        self.res.write_header("Content-Type", "application/json")
        self.res.end(data)

    def error(self, error: object) -> None:
        self.res.write_status(500)
        self.res.end(str(error))


def handle_query(
    handler: Handler,
    con: duckdb.DuckDBPyConnection,
    cache: Cache,
    query: _QueryParams,
) -> None:
    logger.debug(f"{query=}")

    start = time.time()

    sql = query["sql"]
    command = query["type"]

    try:
        if command == "exec":
            con.execute(sql)
            handler.done()
        elif command == "arrow":
            buffer = retrieve(cache, query, partial(get_arrow_bytes, con))
            handler.arrow(buffer)
        elif command == "json":
            json = retrieve(cache, query, partial(get_json, con))
            handler.json(json)
        else:
            msg = f"Unknown command {command}"
            raise ValueError(msg)
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


def server(con: Con, cache: Cache) -> None:
    # SSL server
    # app = App(AppOptions(key_file_name="./localhost-key.pem", cert_file_name="./localhost.pem"))
    app = App()

    # faster serialization than standard json
    app.json_serializer(ujson)

    def ws_message(ws: Ws, message: str | bytes | bytearray, opcode: OpCode) -> None:
        handler = SocketHandler(ws)

        try:
            query: _QueryParams = ujson.loads(message)
        except Exception as e:
            logger.exception("Error reading message from WebSocket")
            handler.error(e)
            return

        handle_query(handler, con, cache, query)

    async def http_handler(res: Res, req: Req) -> None:
        res.write_header("Access-Control-Allow-Origin", "*")
        res.write_header("Access-Control-Request-Method", "*")
        res.write_header("Access-Control-Allow-Methods", "OPTIONS, POST, GET")
        res.write_header("Access-Control-Allow-Headers", "*")
        res.write_header("Access-Control-Max-Age", "2592000")

        method = req.get_method()

        handler = HTTPHandler(res)
        data: _QueryParams
        if method == "OPTIONS":
            handler.done()
        elif method == "GET":
            message: str | bytes | bytearray = req.get_query("query")  # pyright: ignore[reportAssignmentType]
            data = ujson.loads(message)
            handle_query(handler, con, cache, data)
        elif method == "POST":
            maybe_data: _QueryParams | None = await res.get_json()
            if maybe_data:
                handle_query(handler, con, cache, maybe_data)
            else:
                raise NotImplementedError

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
