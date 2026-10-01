"""Drive `MosaicWidget._handle_custom_msg` over stdio for the conformance suite.

Each stdin line is `{"id": n, "content": {...}}`. Every `widget.send` the
handler makes is written as `{"id": n, "kind": "reply", "content": ..., "buffers": [base64...]}`,
and the invocation ends with `{"id": n, "kind": "done", "raised": "Type: message" | null}`
whether or not the handler raised. The `id` identifies the invocation for the
harness only; protocol correlation is judged on the `uuid` inside `content`.
The handler is synchronous, so `done` marks the end of its sends; this shim
does not model asynchronous handlers or Jupyter's message scheduling.

Run from packages/vgplot/widget: `uv run python conformance/shim.py`.
"""

from __future__ import annotations

import base64
import json
import logging
import sys

import duckdb

logging.basicConfig(stream=sys.stderr, level=logging.WARNING)

from mosaic_widget import MosaicWidget

widget = MosaicWidget(con=duckdb.connect())
current: dict[str, object] = {"id": None}


def emit(record: dict[str, object]) -> None:
    sys.stdout.write(json.dumps(record) + "\n")
    sys.stdout.flush()


def send(content, buffers=None):  # noqa: ANN001, ANN201
    emit(
        {
            "id": current["id"],
            "kind": "reply",
            "content": content,
            "buffers": [
                base64.b64encode(bytes(b)).decode("ascii") for b in (buffers or [])
            ],
        }
    )


widget.send = send  # ty: ignore[invalid-assignment]

for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    message = json.loads(line)
    current["id"] = message["id"]
    raised = None
    try:
        widget._handle_custom_msg(message["content"], [])
    except Exception as exc:  # noqa: BLE001
        raised = f"{type(exc).__name__}: {exc}"
    emit({"id": message["id"], "kind": "done", "raised": raised})
