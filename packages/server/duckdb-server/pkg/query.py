import logging
from hashlib import sha256
import duckdb

import pyarrow as pa

logger = logging.getLogger(__name__)


def get_key(sql: str, command: str) -> str:
    return f"{sha256(sql.encode('utf-8')).hexdigest()}.{command}"


def retrieve(cache, query, get):
    sql = query.get("sql")
    command = query.get("type")

    key = get_key(sql, command)
    result = cache.get(key)

    if result:
        logger.debug("Cache hit")
    else:
        result = get(sql)
        if query.get("persist", False):
            cache[key] = result
    return result


def get_arrow(
    con: duckdb.DuckDBPyConnection, sql: str
) -> pa.RecordBatchReader:
    return con.query(sql).arrow()


def arrow_to_bytes(reader: pa.RecordBatchReader):
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, reader.schema) as writer:
        for batch in reader:
            writer.write(batch)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con: duckdb.DuckDBPyConnection, sql: str):
    return arrow_to_bytes(get_arrow(con, sql))


def get_json(con: duckdb.DuckDBPyConnection, sql: str):
    result = con.query(sql).df()
    return result.to_json(orient="records")
