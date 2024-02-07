import logging
import time
from functools import partial
from pathlib import Path

import ujson
from socketify import App, CompressOptions, OpCode

from .__about__ import __version__
from .bundle import create_bundle, load_bundle
from .query import get_arrow_bytes, get_json, retrieve

logger = logging.getLogger(__name__)

BUNDLE_DIR = Path(".mosaic/bundle")


def ws_message(con, cache, ws, message, opcode):
    try:
        query = ujson.loads(message)
    except Exception as e:
        logger.error(e)
        ok = ws.send({"error": str(e)}, OpCode.TEXT)
        return

    logger.debug(f"{query=}")

    start = time.time()

    sql = query["sql"]
    command = query["type"]

    try:
        if command == "exec":
            con.execute(sql)
            ok = ws.send({}, OpCode.TEXT)
        elif command == "arrow":
            buffer = retrieve(cache, query, partial(get_arrow_bytes, con))
            ok = ws.send(buffer, OpCode.BINARY)
        elif command == "json":
            json = retrieve(cache, query, partial(get_json, con))
            ok = ws.send(json, OpCode.TEXT)
        elif command == "create-bundle":
            create_bundle(con, cache, query.get("queries"), BUNDLE_DIR)
            ok = ws.send({}, OpCode.TEXT)
        elif command == "load-bundle":
            load_bundle(con, BUNDLE_DIR)
            ok = ws.send({}, OpCode.TEXT)
        else:
            raise ValueError(f"Unknown command {command}")
    except Exception as e:
        logger.error(e)
        ok = ws.send({"error": str(e)}, OpCode.TEXT)

    total = round((time.time() - start) * 1_000)
    if total > 5000:
        logger.warning(f"DONE. Slow query took { total } ms.\n{ sql }")
    else:
        logger.info(f"DONE. Query took { total } ms.\n{ sql }")

    # Ok is false if backpressure was built up, wait for drain
    if not ok:
        logger.warn("WebSocket backpressure: %i" % ws.get_buffered_amount())


def server(con, cache):
    # SSL server
    # app = App(AppOptions(key_file_name="./localhost-key.pem", cert_file_name="./localhost.pem"))
    app = App()

    # faster serialization than standard json
    app.json_serializer(ujson)

    app.ws(
        "/*",
        {
            "compression": CompressOptions.SHARED_COMPRESSOR,
            "message": partial(ws_message, con, cache),
            "drain": lambda ws: print("WebSocket backpressure: %i" % ws.get_buffered_amount()),
        },
    )

    app.any("/", lambda res, req: res.end(f"Mosaic Server {__version__}. Please connect using a WebSocket."))

    app.listen(3000, lambda config: print("Mosaic Server listening at ws://localhost:%d\n" % (config.port)))
    app.run()
