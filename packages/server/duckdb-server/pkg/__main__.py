from __future__ import annotations

import logging
import sys

import duckdb

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve() -> None:
    db_path = sys.argv[1] if len(sys.argv) >= 2 else ":memory:"  # ruff: ignore[magic-value-comparison]

    logger.info(f"Using DuckDB {db_path}")

    con = duckdb.connect(db_path)

    server(con)


if __name__ == "__main__":
    serve()
