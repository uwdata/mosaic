from __future__ import annotations

from typing import Any

import duckdb

from pkg.server import handle_query


class RecordingHandler:
    def __init__(self) -> None:
        self.errors: list[tuple[str, int]] = []

    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...

    def error(self, error: Any, status: int = 500) -> None:
        self.errors.append((str(error), status))


def test_missing_type_is_bad_request() -> None:
    handler = RecordingHandler()
    handle_query(handler, duckdb.connect(), {"sql": "SELECT 1"})  # pyright: ignore[reportArgumentType]  # ty: ignore[invalid-argument-type, missing-typed-dict-key]

    assert handler.errors == [("missing required 'type' parameter", 400)]
