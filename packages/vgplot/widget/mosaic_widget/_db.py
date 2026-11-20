from __future__ import annotations

from typing import TYPE_CHECKING

import duckdb
from duckdb import DuckDBPyConnection as Con
from duckdb import DuckDBPyRelation as Rel

if TYPE_CHECKING:
    from pathlib import Path


def connect(
    connection: Con | None = None,
    relation: Rel | None = None,
    database: str | Path = ":memory:",
) -> Con:
    """Return an existing or create a new database connection."""
    if connection is not None:
        return connection
    if relation is None or database != ":memory:":
        return duckdb.connect(database)
    return duckdb.default_connection()
