from __future__ import annotations

import functools
from typing import TYPE_CHECKING
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import pyarrow as pa

if TYPE_CHECKING:
    from starlette.testclient import TestClient
    from typing_extensions import LiteralString, TypedDict

    class QueryParams(TypedDict, closed=True):
        query: LiteralString


LB, RB = "{}"


@functools.lru_cache(128)
def _query_string(sql: LiteralString, type: L["arrow", "exec"], /) -> LiteralString:
    return f'{LB}"sql":"{sql}","type":"{type}"{RB}'


def q(sql: LiteralString, /, type: L["arrow", "exec"] = "arrow") -> QueryParams:
    return {"query": _query_string(sql, type)}


def test_query_arrow(client_session: TestClient) -> None:
    response = client_session.get("/", params=q("SELECT 1 AS a"))
    assert response.is_success
    content = response.read()
    with pa.ipc.open_stream(content) as reader:
        table = reader.read_all()
    expected = pa.table({"a": [1]}, schema=pa.schema({"a": pa.int32()}))
    assert table.equals(expected)
