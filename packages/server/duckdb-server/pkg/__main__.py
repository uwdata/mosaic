from __future__ import annotations

import argparse
import logging
import sys

import duckdb

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3000)
    db_path = ":memory:"

    logger.info(f"Using DuckDB {db_path}")

    con = duckdb.connect(db_path)

    server(con)


if __name__ == "__main__":
    serve()
