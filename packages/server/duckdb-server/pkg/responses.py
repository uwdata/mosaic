from __future__ import annotations

from typing import Any, NewType

import starlette.responses

from pkg.serde import serialize_json


class JSONResponse(starlette.responses.JSONResponse):
    def render(self, content: Any) -> bytes:
        return serialize_json(content)


class ArrowResponse(starlette.responses.Response):
    media_type = "application/vnd.apache.arrow.stream"


EmptyResponse = NewType("EmptyResponse", starlette.responses.Response)


def empty_response() -> EmptyResponse:
    return EmptyResponse(starlette.responses.Response())
