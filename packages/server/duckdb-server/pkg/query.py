from __future__ import annotations

from typing import TYPE_CHECKING, final

import pyarrow as pa

from pkg.protocols import Handler, Request, Sql

if TYPE_CHECKING:
    from duckdb import DuckDBPyConnection as Con


@final
class ArrowRequest(Request, forbid_unknown_fields=False):
    """Returns a result table."""

    @staticmethod
    def from_str(sql: str) -> ArrowRequest:
        return ArrowRequest(Sql(sql))

    def get_arrow(self, con: Con) -> pa.RecordBatchReader:
        return con.query(self.sql).to_arrow_reader()

    def run(self, handler: Handler, con: Con) -> None:
        reader = self.get_arrow(con)
        sink = pa.BufferOutputStream()
        with pa.ipc.new_stream(sink, reader.schema) as writer:
            for batch in reader:
                writer.write_batch(batch)
        buffer = sink.getvalue().to_pybytes()
        handler.arrow(buffer)


@final
class ExecRequest(Request, forbid_unknown_fields=False):
    """Statements run in order on one connection.

    The protocol guarantees neither atomicity nor rollback: a later statement
    MAY fail after earlier ones took effect, effects that were committed remain,
    and the server MUST NOT retry on the client's behalf or report which statements
    completed. Whether uncommitted work survives the failure is the
    engine's transaction semantics; clients that need atomicity wrap the
    statements in an explicit transaction and treat its outcome by those
    semantics.
    """

    def run(self, handler: Handler, con: Con) -> None:
        con.execute(self.sql)
        handler.done()
