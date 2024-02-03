import logging
import os
import re
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

BUNDLE_DIR = ".mosaic/bundle"


def retrieve(query, get):
    sql = query.get("sql")
    command = query.get("type")
    persist = query.get("persist", False)

    key = (sql, command)
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
    return sink.getvalue().to_pybytes()


def get_json(sql):
    result = con.query(sql).df()
    return result.to_json(orient="records")


def create_bundle(queries):
    describe_re = re.compile(r"^DESCRIBE ")
    pragma_re = re.compile(r"^PRAGMA ")
    view_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? VIEW")
    table_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? TABLE( IF NOT EXISTS)? ([^\s]+)")

    manifest = {"tables": [], "queries": []}

    for query in queries:
        sql = query if isinstance(query, str) else query.get("sql")

        if query.get("alias"):
            table = query.get("alias")
            file = os.path.join(BUNDLE_DIR, f"{table}.parquet")
            con.execute(f"COPY ({sql}) TO '{file}' (FORMAT PARQUET)")
            manifest["tables"].append(table)

        elif sql.startswith("CREATE "):
            if view_re.match(sql):
                continue  # Ignore views

            table_match = table_re.match(sql)
            if table_match:
                table = table_match.group(3)
                file = os.path.join(BUNDLE_DIR, f"{table}.parquet")
                con.execute(sql)
                con.execute(f"COPY {table} TO '{file}' (FORMAT PARQUET)")
                manifest["tables"].append(table)

        elif not pragma_re.match(sql):
            command = "json" if describe_re.match(sql) else "arrow"
            key = (sql, command)
            if command == "arrow":
                get = get_arrow
            elif command == "json":
                get = get_json
            else:
                raise ValueError(f"Unknown command {command}")
            result = retrieve(query, get)
            with open(os.path.join(BUNDLE_DIR, key), "wb") as f:
                f.write(result)
            manifest["queries"].append(key)

    with open(os.path.join(BUNDLE_DIR, "bundle.json"), "w") as f:
        ujson.dump(manifest, f, indent=2)

    return manifest


def load_bundle():
    with open(os.path.join(BUNDLE_DIR, "bundle.json")) as f:
        manifest = ujson.load(f)

    # Load precomputed query results into the cache
    for key in manifest["queries"]:
        file = os.path.join(BUNDLE_DIR, key)
        json_file = os.path.splitext(file)[1] == ".json"
        with open(file, "rb") as f:
            data = f.read()
            cache.set(key, ujson.loads(data) if json_file else data)

    # Load precomputed temp tables into the database
    for table in manifest["tables"]:
        file = os.path.join(BUNDLE_DIR, f"{table}.parquet")
        con.execute(f"CREATE TEMP TABLE IF NOT EXISTS {table} AS SELECT * FROM '{file}'")


def ws_open(ws):
    logger.info("A WebSocket got connected!")


def ws_message(ws, message, opcode):
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
            buffer = retrieve(query, get_arrow)
            ok = ws.send(buffer, OpCode.BINARY)
        elif command == "json":
            json = retrieve(query, get_json)
            ok = ws.send(json, OpCode.TEXT)
        elif command == "create-bundle":
            pass
            create_bundle(query.get("queries"))
            ok = ws.send({}, OpCode.TEXT)
        elif command == "load-bundle":
            pass
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
    logger.info(f"OK: {ok}")


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
