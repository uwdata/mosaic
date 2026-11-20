from __future__ import annotations

import hashlib
import logging
import os
from typing import TYPE_CHECKING

import duckdb
import pyarrow as pa
from duckdb import DuckDBPyConnection

from pkg.protocols import Sql
from pkg.servers.common import ENV_DB_PATH, IN_MEMORY_DB_NAME

if TYPE_CHECKING:
    from pathlib import Path
    from typing import Self


logger = logging.getLogger(__name__)


class Database:
    _con: DuckDBPyConnection | None
    path: Path | str

    @staticmethod
    def from_env() -> Database:
        db_path = os.environ.get(ENV_DB_PATH, IN_MEMORY_DB_NAME)
        if db_path != IN_MEMORY_DB_NAME:
            logger.debug("Loaded environment variable %s=%r", ENV_DB_PATH, db_path)
        return Database(db_path)

    def __init__(self, path: Path | str = IN_MEMORY_DB_NAME) -> None:
        self.path = path
        self._con = None

    def __enter__(self) -> Self:
        if self._con is not None:  # pragma: no cover
            msg = f"{type(self).__name__!r} is not reentrant"
            raise TypeError(msg)

        self._con = duckdb.connect(self.path)
        logger.info("Connected to DuckDB %s", self.path)
        return self

    @property
    def con(self) -> DuckDBPyConnection:
        con = self._con
        if con is None:  # pragma: no cover
            msg = f"{type(self).__name__!r} connection should not be None"
            raise TypeError(msg)
        return con

    def __exit__(self, *excinfo: object) -> None:
        con = self._con
        if con is None:  # pragma: no cover
            msg = f"{type(self).__name__!r} connection should not be None"
            raise TypeError(msg)
        con.close()
        self._con = None
        logger.info("Closed DuckDB %s", self.path)

    def execute(self, sql: Sql) -> None:  # pragma: no cover
        self.con.execute(sql)
        self.con.complete()

    def preagg(self, sql: Sql) -> list[str]:
        table = f"preagg_{hashlib.sha256(sql.encode()).hexdigest()[:16]}"
        self.execute(Sql("CREATE SCHEMA IF NOT EXISTS mosaic"))
        self.execute(Sql(f'CREATE TABLE IF NOT EXISTS mosaic."{table}" AS {sql}'))
        [(catalog,)] = self.con.execute("SELECT current_database()").fetchall()
        return [catalog, "mosaic", table]

    def get_arrow(self, sql: Sql) -> pa.Buffer:
        reader = self.con.query(sql).to_arrow_reader()
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, reader.schema) as writer:
            for batch in reader:
                writer.write_batch(batch)
        return sink.getvalue()
