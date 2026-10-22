from __future__ import annotations

import functools
from typing import TYPE_CHECKING, Any
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import httpx2
import msgspec
import pyarrow as pa
from httpx2 import RequestError

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


def raise_for_status(response: httpx2.Response) -> httpx2.Response:
    if response.is_success:
        return response
    body = msgspec.json.decode(response.content, type=dict[str, Any])
    message = (
        f"'{response.status_code} {response.reason_phrase}' for url '{response.url}'\n    {body!r}\n"
        f"For more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/{response.status_code}"
    )
    raise RequestError(message)


def test_query_arrow(client_session: TestClient) -> None:
    response = client_session.get("/", params=q("SELECT 1 AS a"))
    raise_for_status(response)
    content = response.read()
    with pa.ipc.open_stream(content) as reader:
        table = reader.read_all()
    expected = pa.table({"a": [1]}, schema=pa.schema({"a": pa.int32()}))
    assert table.equals(expected)
