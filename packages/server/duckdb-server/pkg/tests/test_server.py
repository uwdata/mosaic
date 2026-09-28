from __future__ import annotations

import gzip
import json
from typing import Any

import duckdb
import pytest
from msgspec.json import decode, encode
from socketify import OpCode

from pkg.server import HTTPHandler, Serde, SocketHandler, handle_message


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
        self.headers: dict[str, str] = {}

    def write_status(self, status: int) -> None:
        self.calls.append(("status", status))

    def write_header(self, name: str, value: str) -> None:
        self.calls.append(("header", name))
        self.headers[name] = value

    def end(self, body: Any) -> None:
        self.calls.append(("end", body))


def test_http_error_writes_status_before_headers() -> None:
    res = RecordingResponse()
    HTTPHandler(res).error("boom", 400)  # pyright: ignore[reportArgumentType]  # ty: ignore[invalid-argument-type]

    assert res.calls[0] == ("status", 400)
    assert res.calls[-1] == ("end", "boom")
    assert ("header", "Access-Control-Allow-Origin") in res.calls


@pytest.mark.parametrize(
    "header",
    [
        "gzip",
        "GZip; q=1",
        "gzip ; q=1",
        "gzip\t; q=1",
        "br, gzip",
        "*",
        "identity;q=0,gzip;q=0.5",
        "*;q=0,gzip",
    ],
)
def test_gzip_arrow(header: str) -> None:
    res = RecordingResponse()
    handler = HTTPHandler(res, header)  # ty: ignore[invalid-argument-type]
    buffer = b"Arrow records" * 1000
    handler.arrow(buffer)
    assert res.calls[0] == ("status", 200)
    assert res.headers["Content-Encoding"] == "gzip"
    assert res.headers["Vary"] == "Accept-Encoding"
    assert gzip.decompress(res.calls[-1][1]) == buffer


@pytest.mark.parametrize(
    "header",
    [
        "",
        "br",
        "gzip;q=0",
        "*;q=1,gzip;q=0",
        "gzip;q=0.5,identity;q=1",
        "gzip;q=invalid",
    ],
)
def test_identity_arrow(header: str) -> None:
    res = RecordingResponse()
    buffer = b"Arrow records" * 1000
    HTTPHandler(res, header).arrow(buffer)  # ty: ignore[invalid-argument-type]
    assert "Content-Encoding" not in res.headers
    assert res.calls[-1] == ("end", buffer)
    assert res.headers["Vary"] == "Accept-Encoding"


@pytest.mark.parametrize("header", ["identity;q=0", "*;q=0", "gzip;q=0,identity;q=0"])
def test_unacceptable_encoding(header: str) -> None:
    res = RecordingResponse()
    HTTPHandler(res, header).arrow(b"data")  # ty: ignore[invalid-argument-type]
    assert res.calls[0] == ("status", 406)
    assert res.calls[-1] == ("end", "")


def test_small_response_and_identity_exclusion() -> None:
    for header, compressed in [("gzip", False), ("gzip,identity;q=0", True)]:
        res = RecordingResponse()
        HTTPHandler(res, header).arrow(b"small")  # ty: ignore[invalid-argument-type]
        assert ("Content-Encoding" in res.headers) == compressed
        assert (
            gzip.decompress(res.calls[-1][1]) if compressed else res.calls[-1][1]
        ) == b"small"


def test_exec_remains_empty_and_uncompressed() -> None:
    res = RecordingResponse()
    HTTPHandler(res, "gzip").done()  # ty: ignore[invalid-argument-type]
    assert res.calls[-1] == ("end", "")
    assert "Content-Encoding" not in res.headers


def test_compression_opt_out() -> None:
    for header, status in [("gzip", 200), ("gzip,identity;q=0", 406)]:
        res = RecordingResponse()
        HTTPHandler(res, header, compression=False).arrow(b"x" * 2048)  # ty: ignore[invalid-argument-type]
        assert res.calls[0] == ("status", status)
        assert "Content-Encoding" not in res.headers


def test_serde_matches_socketify_string_contract() -> None:
    serde = Serde(encode, decode)
    text = serde.dumps({"error": "雪"})
    assert isinstance(text, str)
    assert serde.loads(text.encode("utf-8")) == {"error": "雪"}


class RecordingSocket:
    def __init__(self) -> None:
        self.messages: list[tuple[bytes, OpCode, bool]] = []

    def send(self, message: bytes, opcode: OpCode, compress: bool = False) -> bool:
        assert isinstance(message, bytes)
        self.messages.append((message, opcode, compress))
        return True


def test_socket_acknowledgement_error_and_compression() -> None:
    socket = RecordingSocket()
    handler = SocketHandler(socket)  # ty: ignore[invalid-argument-type]
    handler.done()
    handler.error('bad "query"')
    handler.arrow(b"small")
    handler.arrow(b"x" * 2048)
    assert socket.messages[0] == (b"{}", OpCode.TEXT, False)
    assert json.loads(socket.messages[1][0]) == {"error": 'bad "query"'}
    assert socket.messages[1][1:] == (OpCode.TEXT, False)
    assert socket.messages[2][2] is False
    assert socket.messages[3][2] is True
