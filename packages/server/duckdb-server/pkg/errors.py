from __future__ import annotations

import sys
from http import HTTPStatus
from typing import TYPE_CHECKING, TypeVar

from msgspec import DecodeError

from pkg.responses import JSONResponse

if TYPE_CHECKING:
    from collections.abc import Awaitable, Callable, Mapping

    from starlette.requests import Request


if sys.version_info >= (3, 12):
    from typing import TypeAliasType as Type
else:
    from typing_extensions import TypeAliasType as Type

E = TypeVar("E", bound=Exception)
Err = Type("Err", Exception | E, type_params=(E,))


def _response(message: str, status: HTTPStatus) -> JSONResponse:
    return JSONResponse({"detail": message}, status)


async def _decode_error(_: Request, err: Err[DecodeError], /) -> JSONResponse:
    return _response(str(err), HTTPStatus.BAD_REQUEST)


async def _key_error(_: Request, err: Err[KeyError], /) -> JSONResponse:
    if (args := err.args) and args[0] == "query":
        return _response("Missing required 'query' parameter", HTTPStatus.BAD_REQUEST)
    return _response(str(err), HTTPStatus.INTERNAL_SERVER_ERROR)


async def _not_implemented_error(
    _: Request, err: Err[NotImplementedError], /
) -> JSONResponse:
    return _response(str(err), HTTPStatus.NOT_IMPLEMENTED)


def create_exception_handlers() -> Mapping[
    type[Exception], Callable[[Request, Exception], Awaitable[JSONResponse]]
]:
    return {
        DecodeError: _decode_error,
        KeyError: _key_error,
        NotImplementedError: _not_implemented_error,
    }
