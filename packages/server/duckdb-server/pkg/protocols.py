from __future__ import annotations

from typing import Any, NewType, Protocol

import msgspec

Sql = NewType("Sql", str)
"""SQL text. 

- For `arrow` and `preagg` this MUST be exactly one statement; a trailing semicolon is permitted. 
- For `exec` it MAY contain several`;` separated statements, executed in order.
"""


class Request(
    msgspec.Struct, tag=lambda s: s.removesuffix("Request").lower(), tag_field="type"
):
    """A command object.

    `type` is required and discriminates; a missing `type` is rejected with
    `bad_request` / `missing_field` (`field: type`), a missing `sql` with `missing_field` (`field: sql`).
    Properties other than `type` and `sql` are application-owned: servers
    MUST accept them, MUST NOT let them override `type` or `sql`, and MAY
    pass them to a deployment-specific authorizer. Mosaic defines no
    metadata envelope."""

    sql: Sql


# TODO @dangotbanned: Replace with whatever the next framework wants
class Handler(Protocol):
    def done(self) -> None: ...
    def arrow(self, buffer: bytes) -> None: ...
    def error(self, error: Any, status: int = 500) -> None: ...
