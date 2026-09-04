from __future__ import annotations

import logging
from hashlib import sha256
from typing import TYPE_CHECKING, Literal, TypedDict, TypeVar

import pyarrow as pa

if TYPE_CHECKING:
    from collections.abc import Callable

    import duckdb
    from diskcache import Cache
    from typing_extensions import NotRequired

R = TypeVar("R", bound=str | bytes | None)


class _QueryParams(TypedDict):
    type: Literal["arrow", "exec"]
    sql: str
    uuid: str  # name
    persist: NotRequired[bool]


logger = logging.getLogger(__name__)


def get_key(sql: str, command: str) -> str:
    return f"{sha256(sql.encode('utf-8')).hexdigest()}.{command}"


def retrieve(cache: Cache, query: _QueryParams, get: Callable[[str], R]) -> R:
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
    return result  # pyright: ignore[reportReturnType]


def get_arrow(con: duckdb.DuckDBPyConnection, sql: str) -> pa.RecordBatchReader:
    return con.query(sql).arrow()


def arrow_to_bytes(reader: pa.RecordBatchReader) -> bytes:
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, reader.schema) as writer:
        for batch in reader:
            writer.write(batch)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con: duckdb.DuckDBPyConnection, sql: str) -> bytes:
    return arrow_to_bytes(get_arrow(con, sql))
