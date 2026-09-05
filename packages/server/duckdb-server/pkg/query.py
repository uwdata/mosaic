from __future__ import annotations

import logging
from hashlib import sha256
from typing import TYPE_CHECKING, Literal, TypedDict

import pyarrow as pa

if TYPE_CHECKING:
    from diskcache import Cache
    from duckdb import DuckDBPyConnection as Con
    from typing_extensions import NotRequired


class _QueryParams(TypedDict):
    type: Literal["arrow", "exec"]
    sql: str
    uuid: str  # name
    persist: NotRequired[bool]


logger = logging.getLogger(__name__)


def get_key(sql: str, command: Literal["arrow"]) -> str:
    return f"{sha256(sql.encode('utf-8')).hexdigest()}.{command}"


def get_arrow(con: Con, sql: str) -> pa.RecordBatchReader:
    return con.query(sql).arrow()


def retrieve(cache: Cache, query: _QueryParams, con: Con) -> bytes:
    sql = query.get("sql")
    key = get_key(sql, "arrow")
    if isinstance((result := cache.get(key)), bytes):
        logger.debug("Cache hit")
    else:
        result = arrow_to_bytes(get_arrow(con, sql))
        if query.get("persist", False):
            cache[key] = result
    return result


def arrow_to_bytes(reader: pa.RecordBatchReader) -> bytes:
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, reader.schema) as writer:
        for batch in reader:
            writer.write(batch)
    return sink.getvalue().to_pybytes()
