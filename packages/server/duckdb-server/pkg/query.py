from __future__ import annotations

from typing import TYPE_CHECKING

import pyarrow as pa

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as Con


def get_arrow(con: Con, sql: str) -> pa.RecordBatchReader:
    return con.query(sql).arrow()


def arrow_to_bytes(reader: pa.RecordBatchReader) -> bytes:
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, reader.schema) as writer:
        for batch in reader:
            writer.write(batch)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con: Con, sql: str) -> bytes:
    return arrow_to_bytes(get_arrow(con, sql))
