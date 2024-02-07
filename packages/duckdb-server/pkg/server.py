import logging
import os
import re
import time
from functools import partial
from hashlib import sha256
from pathlib import Path

import pyarrow as pa
import ujson
from socketify import App, CompressOptions, OpCode

from .__about__ import __version__

logger = logging.getLogger(__name__)

cache = dict()

BUNDLE_DIR = Path(".mosaic/bundle")


def get_key(sql, command):
    return f"{sha256(sql.encode('utf-8')).hexdigest()}.{command}"


def retrieve(query, get):
    sql = query.get("sql")
    command = query.get("type")
    persist = query.get("persist", False)

    key = get_key(sql, command)
    result = cache.get(key)

    if result:
        logger.debug("Cache hit")
    else:
        result = get(sql)
        if persist:
            cache[key] = result
    return result


def get_arrow(con, sql):
    return con.query(sql).arrow()


def arrow_to_bytes(arrow):
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, arrow.schema) as writer:
        writer.write(arrow)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con, sql):
    return arrow_to_bytes(get_arrow(con, sql))


def get_json(con, sql):
    result = con.query(sql).df()
    return result.to_json(orient="records")


def create_bundle(con, queries, directory=BUNDLE_DIR):
    describe_re = re.compile(r"^DESCRIBE ")
    pragma_re = re.compile(r"^PRAGMA ")
    view_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? VIEW")
    table_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? TABLE( IF NOT EXISTS)? ([^\s]+)")

    manifest = {"tables": [], "queries": []}

    directory.mkdir(parents=True, exist_ok=True)

    for query in queries:
        sql = query if isinstance(query, str) else query.get("sql")

        if isinstance(query, dict) and query.get("alias"):
            table = query.get("alias")
            file = directory / f"{table}.parquet"
            con.execute(f"COPY ({sql}) TO '{file}' (FORMAT PARQUET)")
            manifest["tables"].append(table)

        elif sql.startswith("CREATE "):
            if view_re.match(sql):
                continue  # Ignore views

            table_match = table_re.match(sql)
            if table_match:
                table = table_match.group(3)
                file = directory / f"{table}.parquet"
                con.execute(sql)
                con.execute(f"COPY {table} TO '{file}' (FORMAT PARQUET)")
                manifest["tables"].append(table)

        elif not pragma_re.match(sql):
            command = "json" if describe_re.match(sql) else "arrow"
            key = get_key(sql, command)
            if command == "arrow":
                get = get_arrow_bytes
            elif command == "json":
                get = get_json
            else:
                raise ValueError(f"Unknown command {command}")
            result = retrieve({"sql": sql, "type": sql}, partial(get, con))
            with open(directory / key, "wb") as f:
                f.write(result)
            manifest["queries"].append(key)

    with open(directory / "bundle.json", "w") as f:
        ujson.dump(manifest, f, indent=2)

    return manifest


def load_bundle(con, directory=BUNDLE_DIR):
    with open(directory / "bundle.json") as f:
        manifest = ujson.load(f)

    # Load precomputed query results into the cache
    for key in manifest["queries"]:
        file = directory / key
        json_file = os.path.splitext(file)[1] == ".json"
        with open(file, "rb") as f:
            data = f.read()
            cache[key] = ujson.loads(data) if json_file else data

    # Load precomputed temp tables into the database
    for table in manifest["tables"]:
        file = directory / f"{table}.parquet"
        con.execute(f"CREATE TEMP TABLE IF NOT EXISTS {table} AS SELECT * FROM '{file}'")


def ws_message(con, ws, message, opcode):
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
            buffer = retrieve(query, partial(get_arrow_bytes, con))
            ok = ws.send(buffer, OpCode.BINARY)
        elif command == "json":
            json = retrieve(query, partial(get_json, con))
            ok = ws.send(json, OpCode.TEXT)
        elif command == "create-bundle":
            create_bundle(con, query.get("queries"), BUNDLE_DIR)
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


def server(con):
    # SSL server
    # app = App(AppOptions(key_file_name="./localhost-key.pem", cert_file_name="./localhost.pem"))
    app = App()

    # faster serialization than standard json
    app.json_serializer(ujson)

    app.ws(
        "/*",
        {
            "compression": CompressOptions.SHARED_COMPRESSOR,
            "message": partial(ws_message, con),
            "drain": lambda ws: print("WebSocket backpressure: %i" % ws.get_buffered_amount()),
        },
    )

    app.any("/", lambda res, req: res.end(f"Mosaic Server {__version__}. Please connect using a WebSocket."))

    app.listen(3000, lambda config: print("Mosaic Server listening at ws://localhost:%d\n" % (config.port)))
    app.run()
