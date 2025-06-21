import logging
import sys

import duckdb
from diskcache import Cache

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve():
    db_path = sys.argv[1] if len(sys.argv) >= 2 else ":memory:"  # noqa: PLR2004

    logger.info(f"Using DuckDB {db_path}")

    con = duckdb.connect(db_path)
    cache = Cache()

    logger.info(f"Caching in {cache.directory}")

    server(con, cache)


if __name__ == "__main__":
    serve()
