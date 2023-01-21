#!/usr/bin/env python

# Python implementation of data-server.js

import asyncio
import json
import logging
import time

import pyarrow as pa
import websockets
import duckdb

PORT = 3000


async def handler(websocket):
    con = duckdb.connect()

    con.execute("INSTALL httpfs")
    con.execute("LOAD httpfs")

    load_arrow(con, "data/flights-200k.arrow", "flights")
    load_arrow(con, "data/random-walk.arrow", "walk")
    load_csv(con, "data/penguins.csv", "penguins")
    load_csv(con, "data/athletes.csv", "athletes")
    load_csv(con, "data/seattle-weather.csv", "weather")

    async for message in websocket:
        try:
            query = json.loads(message)
        except json.JSONDecodeError as e:
            logging.error(e)
            await websocket.send(json.dumps({"error": e.msg}))
            continue

        logging.info(f"QUERY: {query}")
        start = time.time()

        try:
            match query["type"]:
                case "arrow":
                    result = con.execute(query["sql"]).arrow()

                    sink = pa.BufferOutputStream()
                    with pa.ipc.new_stream(sink, result.schema) as writer:
                        writer.write(result)
                    buf = sink.getvalue()
                    await websocket.send(buf.to_pybytes())
                case "exec":
                    con.execute(query["sql"]).fetchall()
                    await websocket.send(json.dumps({}))
                case _:
                    result = con.execute(query["sql"]).df()
                    await websocket.send(result.to_json(orient="records"))
        except Exception as e:
            logging.error(e)
            await websocket.send(json.dumps({"error": str(e)}))
            continue

        logging.info(f"DONE. Took { round((time.time() - start) * 1_000) } ms")


def load_arrow(con, path, table):
    with pa.memory_map(path) as source:
        my_arrow = pa.ipc.open_stream(source).read_all()
        con.execute(f"CREATE TABLE IF NOT EXISTS {table} AS SELECT * FROM my_arrow")


def load_csv(con, path, table):
    con.execute(
        f"CREATE TABLE IF NOT EXISTS {table} AS SELECT * FROM read_csv_auto('{path}')"
    )


async def main():
    async with websockets.serve(handler, "", PORT):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logging.info(f"Starting data-server at port {PORT}")
    asyncio.run(main())
