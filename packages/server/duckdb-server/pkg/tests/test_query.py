from __future__ import annotations

import functools
from datetime import datetime
from typing import TYPE_CHECKING, Any
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

import httpx2
import msgspec
import pyarrow as pa
import pytest
from httpx2 import RequestError

if TYPE_CHECKING:
    from typing import LiteralString

    from starlette.testclient import TestClient
    from typing_extensions import TypedDict

    class QueryParams(TypedDict, closed=True):
        query: LiteralString


LB, RB = "{}"


@functools.lru_cache(128)
def _query_string(
    sql: LiteralString, type: L["arrow", "exec", "preagg"], /
) -> LiteralString:
    return f'{LB}"sql":"{sql}","type":"{type}"{RB}'


def q(
    sql: LiteralString, /, type: L["arrow", "exec", "preagg"] = "arrow"
) -> QueryParams:
    return {"query": _query_string(sql, type)}


def raise_for_status(response: httpx2.Response) -> httpx2.Response:
    if response.is_success:
        return response
    else:  # pragma: no cover
        body = msgspec.json.decode(response.content, type=dict[str, Any])
        message = (
            f"'{response.status_code} {response.reason_phrase}' for url '{response.url}'\n    {body!r}\n"
            f"For more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/{response.status_code}"
        )
        raise RequestError(message)


@pytest.mark.smoke
def test_query_arrow(client_session: TestClient) -> None:
    response = client_session.get("/", params=q("SELECT 1 AS a"))
    raise_for_status(response)
    content = response.read()
    with pa.ipc.open_stream(content) as reader:
        table = reader.read_all()
    expected = pa.table({"a": [1]}, schema=pa.schema({"a": pa.int32()}))
    assert table.equals(expected)


# TODO @dangotbanned: Confirm buffer was used
# - Might be easiest to enable coverage/pytest-cov?
def test_buffer(real_server_session: httpx2.Client) -> None:
    response = real_server_session.get("/", params=q("SELECT 2 AS b"))
    raise_for_status(response)
    content = response.read()
    with pa.ipc.open_stream(content) as reader:
        table = reader.read_all()
    expected = pa.table({"b": [2]}, schema=pa.schema({"b": pa.int32()}))
    assert table.equals(expected)


def test_query_preagg(client_session: TestClient) -> None:
    def preagg() -> dict[str, Any]:
        response = client_session.get("/", params=q("SELECT 42 AS answer", "preagg"))
        return msgspec.json.decode(raise_for_status(response).content)

    first, second = preagg(), preagg()
    catalog, schema, table = first["reference"]
    assert (catalog, schema) == ("memory", "mosaic")
    assert table.startswith("preagg_")
    assert second["reference"] == first["reference"]
    assert datetime.fromisoformat(first["createdAt"]).tzinfo is not None

    sql = f'SELECT answer FROM mosaic."{table}"'
    query = msgspec.json.encode({"type": "arrow", "sql": sql}).decode()
    response = client_session.get("/", params={"query": query})
    with pa.ipc.open_stream(raise_for_status(response).read()) as reader:
        assert reader.read_all().column("answer").to_pylist() == [42]
