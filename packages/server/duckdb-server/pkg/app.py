from __future__ import annotations

from http import HTTPStatus
from io import BytesIO
from typing import TYPE_CHECKING, Any, TypedDict

import msgspec
from starlette.applications import Starlette
from starlette.endpoints import HTTPEndpoint
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse as _JSONResponse
from starlette.routing import Route

from pkg.db import Database
from pkg.query import ArrowRequest, ExecRequest

if TYPE_CHECKING:
    from pathlib import Path

    from starlette.requests import Request
    from starlette.responses import Response


_ALLOW_ALL = ("*",)
_SECONDS_24_HOURS = 86_400
decoder: msgspec.json.Decoder[ArrowRequest | ExecRequest] = msgspec.json.Decoder(
    ArrowRequest | ExecRequest
)

encoder = msgspec.json.Encoder()


class JSONResponse(_JSONResponse):
    def render(self, content: Any) -> bytes:
        return encoder.encode(content)

# TODO @dangotbanned: `"missing required 'query' parameter", 400`
# TODO @dangotbanned: `"Error processing query", 500`
async def handle_error(request: Request, response: Exception) -> Response | Any:
    if isinstance(response, msgspec.DecodeError):
        return JSONResponse({"detail": str(response)}, HTTPStatus.BAD_REQUEST)
    return response


# TODO @dangotbanned: figure out the dep injection to request
class AppState(TypedDict):
    db: Database


def _get_db(application: Starlette) -> Database:
    # NOTE: Really dislike this untyped `state`
    obj: Database = application.state.db
    return obj


class Endpoint(HTTPEndpoint):
    async def get(self, request: Request[AppState]) -> Response:
        query = decoder.decode(request.query_params["query"])
        db = _get_db(request.app)
        return query.run_command(db)

    async def post(self, request: Request[AppState]) -> Response:
        buf = BytesIO()
        async for chunk in request.stream():
            buf.write(chunk)
        query = decoder.decode(buf.getbuffer())
        db = _get_db(request.app)
        return query.run_command(db)


def create_app(db_path: Path | str = ":memory:") -> Starlette:
    cors = Middleware(
        CORSMiddleware,
        allow_origins=_ALLOW_ALL,
        allow_methods=("OPTIONS", "POST", "GET"),
        allow_headers=_ALLOW_ALL,
        max_age=_SECONDS_24_HOURS,
    )
    # TODO @dangotbanned: Look into compression/tracing equivalent
    middleware = (cors,)
    routes = (Route("/", Endpoint, methods=("GET", "POST"), middleware=middleware),)

    app = Starlette(routes=routes, exception_handlers={Exception: handle_error})
    app.state.db = Database(db_path)
    return app
