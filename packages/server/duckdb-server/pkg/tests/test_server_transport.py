from __future__ import annotations

import base64
import gzip
import http.client
import json
import os
import socket
import struct
import subprocess
import sys
import time
import zlib
from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from collections.abc import Iterator


@pytest.fixture(scope="module")
def port() -> Iterator[int]:
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    code = """
import logging
import sys
import duckdb
from socketify import App
from pkg.server import server
logging.basicConfig(level=logging.CRITICAL)
listen = App.listen
App.listen = lambda self, port, callback: listen(self, int(sys.argv[1]), callback)
server(duckdb.connect())
"""
    process = subprocess.Popen(
        [sys.executable, "-c", code, str(port)], stdout=subprocess.DEVNULL
    )
    try:
        for _ in range(100):
            assert process.poll() is None, "server exited before listening"
            try:
                with socket.create_connection(("127.0.0.1", port), timeout=0.1):
                    break
            except OSError:
                time.sleep(0.05)
        else:
            pytest.fail("server did not listen")
        yield port
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def test_http_arrow_negotiation_on_keepalive_connection(port: int) -> None:
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
    try:
        payload = json.dumps({"type": "arrow", "sql": "SELECT i FROM range(1000) t(i)"})
        results = []
        for encoding in ["gzip", "identity"]:
            connection.request(
                "POST",
                "/",
                payload,
                {"Content-Type": "application/json", "Accept-Encoding": encoding},
            )
            response = connection.getresponse()
            data = response.read()
            assert response.status == 200
            assert not response.will_close
            assert response.getheader("Vary") == "Accept-Encoding"
            if encoding == "gzip":
                assert response.getheader("Content-Encoding") == "gzip"
                data = gzip.decompress(data)
            else:
                assert response.getheader("Content-Encoding") is None
            results.append(data)
        assert results[0] == results[1]
    finally:
        connection.close()


def read_exact(stream: socket.socket, size: int) -> bytes:
    data = bytearray()
    while len(data) < size:
        part = stream.recv(size - len(data))
        assert part, "unexpected socket closure"
        data.extend(part)
    return bytes(data)


def exchange(stream: socket.socket, request: dict[str, str]) -> tuple[int, bool, bytes]:
    payload = json.dumps(request).encode()
    mask = os.urandom(4)
    assert len(payload) < 126
    masked = bytes(value ^ mask[i % 4] for i, value in enumerate(payload))
    stream.sendall(bytes([0x81, 0x80 | len(payload)]) + mask + masked)
    message = bytearray()
    opcode = None
    compressed = False
    while True:
        flags, size = read_exact(stream, 2)
        assert not size & 128
        if opcode is None:
            opcode = flags & 15
            compressed = bool(flags & 64)
        size &= 127
        if size == 126:
            size = struct.unpack("!H", read_exact(stream, 2))[0]
        elif size == 127:
            size = struct.unpack("!Q", read_exact(stream, 8))[0]
        message.extend(read_exact(stream, size))
        if flags & 128:
            return opcode, compressed, bytes(message)


@pytest.mark.parametrize("compression", [False, True])
def test_socket_exec_error_and_arrow(port: int, compression: bool) -> None:
    with socket.create_connection(("127.0.0.1", port), timeout=5) as stream:
        key = base64.b64encode(os.urandom(16)).decode()
        headers = [
            "GET / HTTP/1.1",
            f"Host: 127.0.0.1:{port}",
            "Connection: Upgrade",
            "Upgrade: websocket",
            "Sec-WebSocket-Version: 13",
            f"Sec-WebSocket-Key: {key}",
        ]
        if compression:
            headers.append("Sec-WebSocket-Extensions: permessage-deflate")
        stream.sendall(("\r\n".join(headers) + "\r\n\r\n").encode())
        response = bytearray()
        while not response.endswith(b"\r\n\r\n"):
            response.extend(read_exact(stream, 1))
        assert response.startswith(b"HTTP/1.1 101")
        assert (b"permessage-deflate" in response) == compression
        assert exchange(stream, {"type": "exec", "sql": "SELECT 1"}) == (
            1,
            False,
            b"{}",
        )
        opcode, compressed, data = exchange(
            stream, {"type": "arrow", "sql": "SELECT missing_column"}
        )
        assert opcode == 1
        assert not compressed
        assert "error" in json.loads(data)
        opcode, compressed, data = exchange(
            stream, {"type": "arrow", "sql": "SELECT i FROM range(1000) t(i)"}
        )
        assert opcode == 2
        assert compressed == compression
        if compressed:
            data = zlib.decompressobj(-15).decompress(data + b"\x00\x00\xff\xff")
        import pyarrow.ipc

        table = pyarrow.ipc.open_stream(data).read_all()
        assert table.column("i").to_pylist() == list(range(1000))
