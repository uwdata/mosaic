from __future__ import annotations

import sys
from typing import TYPE_CHECKING, Generic, NewType, TypeVar

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


class Command(
    msgspec.Struct,
    Generic[R],
    tag=lambda s: s.removesuffix("Request").lower(),
    tag_field="type",
):
    sql: Sql

    def _query(self, db: Database, /) -> R:
        msg = f"'{type(self).__name__}.{self._query.__name__}()' is not yet implemented"
        raise NotImplementedError(msg)

    def _into_response(self, result: R, /) -> Response:
        msg = f"'{type(self).__name__}.{self._into_response.__name__}()' is not yet implemented"
        raise NotImplementedError(msg)

    def run(self, db: Database, /) -> Response:
        result = self._query(db)
        return self._into_response(result)


if sys.version_info >= (3, 12):
    readonly_buffer = memoryview
    """Zero-copy on `python>=3.12` using [PEP 688].
    
    [PEP 688]: https://peps.python.org/pep-0688/
    """

else:
    import functools

    import pyarrow as pa
    from typing_extensions import Buffer

    @functools.singledispatch
    def readonly_buffer(obj: Buffer, /) -> memoryview:
        # NOTE: Technically possible to backport by using the C API
        # https://github.com/pallets/click/blob/2247b35ea1c47c727d7a06e51fa280e12a863ff6/src/click/_winconsole.py#L75-L111
        return memoryview(obj)

    @readonly_buffer.register(pa.Buffer)
    def _(obj: pa.Buffer, /) -> memoryview:
        return memoryview(obj.to_pybytes())
