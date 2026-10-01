from __future__ import annotations

from typing import TYPE_CHECKING

import duckdb
import pyarrow as pa
from duckdb import DuckDBPyConnection

if TYPE_CHECKING:
    from pathlib import Path

    from pkg.protocols import Sql


class Database:
    con: DuckDBPyConnection

    def __init__(self, path: Path | str = ":memory:") -> None:
        self.con = duckdb.connect(path)

    def execute(self, sql: Sql) -> None:
        self.con.execute(sql)

    def get_arrow(self, sql: Sql) -> pa.Buffer:
        reader = self.con.query(sql).to_arrow_reader()
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, reader.schema) as writer:
            for batch in reader:
                writer.write_batch(batch)
        return sink.getvalue()
