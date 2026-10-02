from __future__ import annotations

from typing import TYPE_CHECKING, Any, Generic, NewType, Protocol, TypeVar

import msgspec

if TYPE_CHECKING:
    from starlette.responses import Response

    from pkg.db import Database

Sql = NewType("Sql", str)
"""SQL text. 

- For `arrow` and `preagg` this MUST be exactly one statement; a trailing semicolon is permitted. 
- For `exec` it MAY contain several`;` separated statements, executed in order.
"""

R = TypeVar("R")


class Request(
    msgspec.Struct,
    Generic[R],
    tag=lambda s: s.removesuffix("Request").lower(),
    tag_field="type",
):
    """A command object.

    `type` is required and discriminates; a missing `type` is rejected with
    `bad_request` / `missing_field` (`field: type`), a missing `sql` with `missing_field` (`field: sql`).
    Properties other than `type` and `sql` are application-owned: servers
    MUST accept them, MUST NOT let them override `type` or `sql`, and MAY
    pass them to a deployment-specific authorizer. Mosaic defines no
    metadata envelope."""

    sql: Sql

    def _query(self, db: Database, /) -> R:
        msg = f"'{type(self).__name__}.{self._query.__name__}()' is not yet implemented"
        raise NotImplementedError(msg)

    def _into_response(self, result: R, /) -> Response:
        msg = f"'{type(self).__name__}.{self._into_response.__name__}()' is not yet implemented"
        raise NotImplementedError(msg)

    # TODO @dangotbanned: Rename after switching fully from socketify
    def run_command(self, db: Database, /) -> Response:
        result = self._query(db)
        return self._into_response(result)


# TODO @dangotbanned: Replace with whatever the next framework wants
class Handler(Protocol):
    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...
    def error(self, error: Any, status: int = 500) -> None: ...
