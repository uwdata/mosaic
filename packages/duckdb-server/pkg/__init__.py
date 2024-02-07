import logging
import sys

import duckdb

from .server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve():
    db_path = sys.argv[1] if len(sys.argv) >= 2 else ":memory:"

    logger.info(f"Using DuckDB {db_path}")

    con = duckdb.connect(db_path)
    server(con)
