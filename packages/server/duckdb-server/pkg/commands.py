from __future__ import annotations

import sys
from typing import TYPE_CHECKING, final

import pyarrow as pa

from pkg import protocols
from pkg.protocols import readonly_buffer
from pkg.responses import ArrowResponse, EmptyResponse, empty_response

if TYPE_CHECKING:
    from pkg.db import Database

if sys.version_info >= (3, 12):
    from typing import TypeAliasType as Type
else:  # pragma: no cover
    from typing_extensions import TypeAliasType as Type


@final
class ArrowRequest(protocols.Command[pa.Buffer], forbid_unknown_fields=False):
    """Returns a result table."""

    def _query(self, db: Database, /) -> pa.Buffer:
        return db.get_arrow(self.sql)

    def _into_response(self, buffer: pa.Buffer, /) -> ArrowResponse:
        return ArrowResponse(readonly_buffer(buffer))


@final
class ExecRequest(protocols.Command[None], forbid_unknown_fields=False):
    """Statements run in order on one connection."""

    def _query(self, db: Database) -> None:   # pragma: no cover
        db.execute(self.sql)

    def _into_response(self, _: None, /) -> EmptyResponse:   # pragma: no cover
        return empty_response()


Command = Type("Command", ArrowRequest | ExecRequest)
