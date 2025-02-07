import logging
import sys

import ibis
import sqlglot
from diskcache import Cache

from pkg.server import server

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def process_query(query: str) -> str:
    logger.debug(f"Processing query: {query}")
    target_query = sqlglot.transpile(query, read="duckdb", write="postgres")[0]
    logger.debug(f"Transpiled query: {target_query}")
    return target_query


class MosaicConnection:
    def __init__(self, backend: ibis.BaseBackend):
        self.backend = backend
        self.duckdb = ibis.duckdb.connect()

    def query(self, query: str):
        # We query duckdb natively when encountering a describe statement or when backend is set to duckdb
        # SQLGlot parses DESCRIBE statements under the hood, but packages/core/src/util/field-info.js expects responses in duckdb's format
        if query.lower().startswith("describe") or self.backend.name == "duckdb":
            res = self.duckdb.con.query(query).arrow()
            # We still return an ibis.Table object to keep the interface consistent
            return ibis.memtable(res)

        # In all other cases we go through the Ibis backend's SQL API
        # DuckDB query -> Ibis internal query representation -> Backend-specific query
        logger.debug(f'Executing query on backend: {self.backend.name}')
        table = self.backend.sql(query, dialect="duckdb")
        logger.debug(f'Ibis internal representation: {table}')
        return table

    def execute(self, query: str):
        # For this experiment we create all tables in DuckDB first, then sync them to the backend
        # (many backends do not support read_parquet, do not have access to local files, etc.)
        execute_res = self.duckdb.con.execute(query)
        self._sync_tables()
        return execute_res

    def _sync_tables(self):
        # We use the DuckDB backend instance as our catalog of tables and copy their contents to the target backend
        for table_name in self.duckdb.list_tables():
            table = self.duckdb.table(table_name)
            self.backend.create_table(table_name, table.to_pyarrow(), overwrite=True)


def serve():
    backend_resource = sys.argv[1] if len(sys.argv) >= 2 else "duckdb://:memory:"  # noqa: PLR2004

    logger.info(f"Using backend resource {backend_resource}")
    backend = ibis.connect(backend_resource)

    con = MosaicConnection(backend)

    cache = Cache()

    logger.info(f"Caching in {cache.directory}")

    server(con, cache)


if __name__ == "__main__":
    serve()
