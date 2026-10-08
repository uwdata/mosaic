from __future__ import annotations

import argparse
import logging
import sys

import duckdb

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

MAX_PORT = 65535


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="duckdb-server", description="Mosaic DuckDB server"
    )
    parser.add_argument(
        "database",
        nargs="?",
        default=":memory:",
        help="DuckDB database path (default: in-memory)",
    )
    parser.add_argument(
        "-p", "--port", type=int, default=3000, help="port to listen on (default: 3000)"
    )
    args = parser.parse_args(argv)
    if not 0 <= args.port <= MAX_PORT:
        parser.error(f"invalid --port value: {args.port}")
    return args


def serve() -> None:
    args = parse_args(sys.argv[1:])

    logger.info(f"Using DuckDB {args.database}")

    con = duckdb.connect(args.database)

    server(con, port=args.port)


if __name__ == "__main__":
    serve()
