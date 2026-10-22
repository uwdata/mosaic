from __future__ import annotations

from typing import TYPE_CHECKING, Any

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    import pytest


def test_query_error_is_sent_to_frontend(monkeypatch: pytest.MonkeyPatch) -> None:
    widget = MosaicWidget()
    sent: list[dict[str, Any]] = []
    monkeypatch.setattr(
        widget, "send", lambda content, buffers=None: sent.append(content)
    )

    widget._handle_custom_msg(
        {
            "type": "exec",
            "sql": "CREATE TABLE t AS SELECT * FROM read_parquet('missing.parquet')",
            "uuid": "1",
        },
        [],
    )

    [message] = sent
    assert message["uuid"] == "1"
    assert "missing.parquet" in message["error"]
