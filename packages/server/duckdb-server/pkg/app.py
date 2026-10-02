from __future__ import annotations

from io import BytesIO
from typing import TYPE_CHECKING, TypedDict

from starlette.applications import Starlette
from starlette.endpoints import HTTPEndpoint
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from starlette.routing import Route

from pkg.commands import Command
from pkg.db import Database
from pkg.errors import create_exception_handlers
from pkg.serde import deserialize_json

if TYPE_CHECKING:
    from pathlib import Path

    from starlette.requests import Request
    from starlette.responses import Response


_ALLOW_ALL = ("*",)
_SECONDS_24_HOURS = 86_400


# TODO @dangotbanned: figure out the dep injection to request
class AppState(TypedDict):
    db: Database


def _get_db(application: Starlette) -> Database:
    # NOTE: Really dislike this untyped `state`
    obj: Database = application.state.db
    return obj


# TODO @dangotbanned: Slow query logging
# start: `query.run_command`
# end  : after the `Response` is served
# - not sure how to hook into that yet
class Endpoint(HTTPEndpoint):
    async def get(self, request: Request[AppState]) -> Response:
        query = deserialize_json(request.query_params["query"], Command)
        db = _get_db(request.app)
        return query.run_command(db)

    async def post(self, request: Request[AppState]) -> Response:
        buf = BytesIO()
        async for chunk in request.stream():
            buf.write(chunk)
        query = deserialize_json(buf.getbuffer(), Command)
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

    app = Starlette(routes=routes, exception_handlers=create_exception_handlers())
    app.state.db = Database(db_path)
    return app
