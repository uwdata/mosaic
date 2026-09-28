from __future__ import annotations

import argparse
import logging
import sys

import duckdb

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve() -> None:
    parser = argparse.ArgumentParser(description="Mosaic DuckDB server")
    parser.add_argument("database", nargs="?", default=":memory:")
    parser.add_argument("--port", type=int, default=3000)
    parser.add_argument("--no-compression", action="store_true")
    args = parser.parse_args()
    db_path = args.database

    logger.info(f"Using DuckDB {db_path}")

    con = duckdb.connect(db_path)

    server(con, port=args.port, compression=not args.no_compression)


if __name__ == "__main__":
    serve()
