from __future__ import annotations

import duckdb
import pyarrow as pa

from pkg.query import ArrowRequest


def test_query_arrow() -> None:
    con = duckdb.connect()
    my_schema = pa.schema([pa.field("a", pa.int32())])
    expected = pa.Table.from_pylist([{"a": 1}], schema=my_schema)
    result = ArrowRequest.from_str("SELECT 1 AS a").get_arrow(con).read_all()
    assert result == expected
