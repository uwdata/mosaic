from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any

from mosaic_widget import MosaicWidget

if TYPE_CHECKING:
    import pytest


def test_preagg_returns_stable_reference(monkeypatch: pytest.MonkeyPatch) -> None:
    widget = MosaicWidget()
    sent: list[dict[str, Any]] = []
    monkeypatch.setattr(
        widget, "send", lambda content, buffers=None: sent.append(content)
    )
    request: Any = {"type": "preagg", "sql": "SELECT 42 AS answer", "uuid": "1"}

    widget._handle_custom_msg(request, [])
    widget._handle_custom_msg(request, [])

    first, second = sent
    catalog, schema, table = first["reference"]
    assert (catalog, schema) == ("memory", "mosaic")
    assert second["reference"] == first["reference"]
    assert datetime.fromisoformat(first["createdAt"]).tzinfo is not None
    assert widget.con.execute(f'SELECT answer FROM mosaic."{table}"').fetchall() == [
        (42,)
    ]
