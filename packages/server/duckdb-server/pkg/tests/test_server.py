from __future__ import annotations

from typing import Any

import duckdb

from pkg.server import HTTPHandler, handle_message


class RecordingHandler:
    def __init__(self) -> None:
        self.errors: list[tuple[str, int]] = []
        self.buffers: list[bytes] = []

    def done(self) -> None: ...

    def arrow(self, buffer: bytes) -> None:
        self.buffers.append(buffer)

    def error(self, error: Any, status: int = 500) -> None:
        self.errors.append((str(error), status))


def test_missing_type_is_bad_request() -> None:
    handler = RecordingHandler()
    handle_message(handler, duckdb.connect(), '{"sql": "SELECT 1"}')

    assert handler.errors == [("Object missing required field `type`", 400)]


def test_unknown_type_is_bad_request() -> None:
    handler = RecordingHandler()
    handle_message(handler, duckdb.connect(), '{"type": "json", "sql": "SELECT 1"}')

    assert handler.errors == [("Invalid enum value 'json' - at `$.type`", 400)]


def test_arrow_query_returns_buffer() -> None:
    handler = RecordingHandler()
    handle_message(handler, duckdb.connect(), '{"type": "arrow", "sql": "SELECT 1"}')

    assert handler.errors == []
    assert len(handler.buffers) == 1


class RecordingResponse:
    def __init__(self) -> None:
        self.calls: list[tuple[str, Any]] = []

    def write_status(self, status: int) -> None:
        self.calls.append(("status", status))

    def write_header(self, name: str, value: str) -> None:
        self.calls.append(("header", name))

    def end(self, body: Any) -> None:
        self.calls.append(("end", body))


def test_http_error_writes_status_before_headers() -> None:
    res = RecordingResponse()
    HTTPHandler(res).error("boom", 400)  # pyright: ignore[reportArgumentType]  # ty: ignore[invalid-argument-type]

    assert res.calls[0] == ("status", 400)
    assert res.calls[-1] == ("end", "boom")
    assert ("header", "Access-Control-Allow-Origin") in res.calls
