from __future__ import annotations

from functools import partial

import duckdb
import pyarrow as pa

from pkg.query import get_arrow, get_json


def test_query_json() -> None:
    con = duckdb.connect()

    assert partial(get_json, con)("SELECT 1 AS a") == '[{"a":1}]'


def test_query_arrow() -> None:
    con = duckdb.connect()

    my_schema = pa.schema([pa.field("a", pa.int32())])
    table = pa.Table.from_pylist([{"a": 1}], schema=my_schema)

    assert partial(get_arrow, con)("SELECT 1 AS a").read_all() == table
