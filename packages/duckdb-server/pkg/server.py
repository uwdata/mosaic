import logging
import sys
import time
from functools import partial
from pathlib import Path

import ujson
from socketify import App, CompressOptions, OpCode

from pkg.bundle import create_bundle, load_bundle
from pkg.query import get_arrow_bytes, get_json, retrieve

logger = logging.getLogger(__name__)

BUNDLE_DIR = Path(".mosaic/bundle")
SLOW_QUERY_THRESHOLD = 5000


class Handler:
    def done(self):
        raise Exception("NotImplementedException")

    def arrow(self, _buffer):
        raise Exception("NotImplementedException")

    def json(self, _data):
        raise Exception("NotImplementedException")

    def error(self, _error):
        raise Exception("NotImplementedException")


class SocketHandler(Handler):
    def __init__(self, ws):
        self.ws = ws

    def check(self, ok):
        if not ok:
            logger.warning(f"WebSocket backpressure: {self.ws.get_buffered_amount()}")

    def done(self):
        ok = self.ws.send({}, OpCode.TEXT)
        self.check(ok)

    def arrow(self, buffer):
        ok = self.ws.send(buffer, OpCode.BINARY)
        self.check(ok)

    def json(self, data):
        ok = self.ws.send(data, OpCode.TEXT)
        self.check(ok)

    def error(self, error):
        ok = self.ws.send({"error": str(error)}, OpCode.TEXT)
        self.check(ok)


class HTTPHandler(Handler):
    def __init__(self, res):
        self.res = res

    def done(self):
        self.res.end("")

    def arrow(self, buffer):
        self.res.write_header("Content-Type", "application/octet-stream")
        self.res.end(buffer)

    def json(self, data):
        self.res.write_header("Content-Type", "application/json")
        self.res.end(data)

    def error(self, error):
        self.res.write_status(500)
        self.res.end(str(error))


def handle_query(handler: Handler, con, cache, query):
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
        elif command == "create-bundle":
            create_bundle(con, cache, query.get("queries"), BUNDLE_DIR / query.get("name"))
            handler.done()
        elif command == "load-bundle":
            load_bundle(con, cache, BUNDLE_DIR / query.get("name"))
            handler.done()
        else:
            raise ValueError(f"Unknown command {command}")
    except Exception as e:
        logger.exception("Eror processing query")
        handler.error(e)

    total = round((time.time() - start) * 1_000)
    if total > SLOW_QUERY_THRESHOLD:
        logger.warning(f"DONE. Slow query took { total } ms.\n{ sql }")
    else:
        logger.info(f"DONE. Query took { total } ms.\n{ sql }")


def on_error(error, res, req):
    logger.error(str(error))
    if res is not None:
        res.write_status(500)
        res.end(f"Error {error}")


def server(con, cache):
    # SSL server
    # app = App(AppOptions(key_file_name="./localhost-key.pem", cert_file_name="./localhost.pem"))
    app = App()

    # faster serialization than standard json
    app.json_serializer(ujson)

    def ws_message(ws, message, opcode):
        handler = SocketHandler(ws)

        try:
            query = ujson.loads(message)
        except Exception as e:
            logger.exception("Error reading message from WebSocket")
            handler.error(e)
            return

        handle_query(handler, con, cache, query)

    async def http_handler(res, req):
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
            data = ujson.loads(req.get_query("query"))
            handle_query(handler, con, cache, data)
        elif method == "POST":
            data = await res.get_json()
            handle_query(handler, con, cache, data)

    app.ws(
        "/*",
        {
            "compression": CompressOptions.SHARED_COMPRESSOR,
            "message": ws_message,
            "drain": lambda ws: logger.warning(f"WebSocket backpressure: {ws.get_buffered_amount()}"),
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
