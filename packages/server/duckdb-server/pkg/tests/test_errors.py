from __future__ import annotations

from http import HTTPStatus
from typing import TYPE_CHECKING

import msgspec
import pytest

if TYPE_CHECKING:
    import httpx2
    from starlette.testclient import TestClient
    from typing_extensions import LiteralString

LB, RB = "{}"
deserialize = msgspec.json.Decoder(dict[str, str]).decode


def assert_error(
    message: LiteralString, status: HTTPStatus, response: httpx2.Response
) -> None:
    __tracebackhide__ = True
    assert response.status_code == status
    content = deserialize(response.content)
    assert content == {"detail": message}


@pytest.mark.parametrize(
    ("type", "sql", "message"),
    [
        (None, "SELECT 1", "Object missing required field `type`"),
        ("json", "SELECT 1", "Invalid value 'json' - at `$.type`"),
        ("arrow", None, "Object missing required field `sql`"),
        ("exec", None, "Object missing required field `sql`"),
        (None, None, "Object missing required field `type`"),
    ],
)
def test_bad_request(
    client_session: TestClient,
    type: str | None,
    sql: str | None,
    message: LiteralString,
) -> None:
    qs = ""
    if type is not None:
        qs = f'"type":"{type}"'
    if sql is not None:
        qs = ",".join((qs, f'"sql":"{sql}"')).removeprefix(",")
    qs = f"{LB}{qs}{RB}"
    response = client_session.get("/", params={"query": qs})
    assert_error(message, HTTPStatus.BAD_REQUEST, response)


def test_method_not_allowed(client_session: TestClient) -> None:
    response = client_session.delete("/")
    assert response.status_code == HTTPStatus.METHOD_NOT_ALLOWED
