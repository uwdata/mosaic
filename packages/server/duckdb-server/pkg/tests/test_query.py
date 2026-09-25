from __future__ import annotations

import duckdb
import pyarrow as pa

from pkg.query import get_arrow


def test_query_arrow() -> None:
    con = duckdb.connect()

    my_schema = pa.schema([pa.field("a", pa.int32())])
    table = pa.Table.from_pylist([{"a": 1}], schema=my_schema)

    assert get_arrow(con, "SELECT 1 AS a").read_all() == table
