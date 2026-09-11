from __future__ import annotations

from typing import Any, cast

import duckdb

from pkg.server import _QueryParams, handle_query


class RecordingHandler:
    def __init__(self) -> None:
        self.errors: list[tuple[str, int]] = []

    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...

    def error(self, error: Any, status: int = 500) -> None:
        self.errors.append((str(error), status))


def test_missing_type_is_bad_request() -> None:
    handler = RecordingHandler()
    query = cast("_QueryParams", {"sql": "SELECT 1"})

    handle_query(handler, duckdb.connect(), query)

    assert handler.errors == [("missing required 'type' parameter", 400)]
