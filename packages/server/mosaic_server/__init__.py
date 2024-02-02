import logging
import sys
import time

import duckdb
import pyarrow as pa
import ujson
from __about__ import __version__
from socketify import App, CompressOptions, OpCode

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

con = duckdb.connect()

cache = dict()


def retrieve(query, get):
    sql = query.get("sql")
    type = query.get("type")
    persist = query.get("persist", False)

    key = (sql, type)
    result = cache.get(key)

    if result:
        logger.debug("Cache hit")
    else:
        result = get(sql)
        if persist:
            cache[key] = result
    return result


def get_arrow(sql):
    result = con.query(sql).arrow()
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, result.schema) as writer:
        writer.write(result)
    return sink.getvalue()


def get_json(sql):
    result = con.query(sql).df()
    return result.to_json(orient="records")


def ws_open(ws):
    logger.info("A WebSocket got connected!")


def ws_message(ws, message, opcode):
    try:
        data = ujson.loads(message)
    except Exception as e:
        logger.error(e)
        ws.send({"error": str(e)}, OpCode.TEXT)
        return

    logger.debug(f"{data=}")
    start = time.time()

    sql = data["sql"]
    type = data["type"]

    try:
        if type == "exec":
            con.execute(sql)
            ws.send({}, OpCode.TEXT)
        elif type == "arrow":
            buffer = retrieve(data, get_arrow)
            ws.send(buffer, OpCode.BINARY)
        elif type == "json":
            json = retrieve(data, get_json)
            ws.send(json, OpCode.TEXT)
        else:
            ws.send({"error": f"Unknown command {type}"}, OpCode.TEXT)
    except Exception as e:
        logger.error(e)
        ws.send({"error": str(e)}, OpCode.TEXT)

    total = round((time.time() - start) * 1_000)
    if total > 5000:
        logger.warning(f"DONE. Slow query took { total } ms.\n{ sql }")
    else:
        logger.info(f"DONE. Query took { total } ms.\n{ sql }")

    # Ok is false if backpressure was built up, wait for drain
    ok = ws.send(message, opcode)
    print(ok)


def server():
    app = App()
    app.json_serializer(ujson)
    app.ws(
        "/*",
        {
            "compression": CompressOptions.SHARED_COMPRESSOR,
            "open": ws_open,
            "message": ws_message,
            "drain": lambda ws: print("WebSocket backpressure: %i" % ws.get_buffered_amount()),
        },
    )

    app.any("/", lambda res, req: res.end(f"Mosaic Server {__version__}. Please connect using a WebSocket."))

    app.listen(3000, lambda config: print("Mosaic Server listening at ws://localhost:%d\n" % (config.port)))
    app.run()


if __name__ == "__main__":
    server()
