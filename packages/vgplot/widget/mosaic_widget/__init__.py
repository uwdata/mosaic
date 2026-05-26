from __future__ import annotations

import logging
import pathlib
import re
import time
from collections.abc import Sequence
from typing import TYPE_CHECKING

import anywidget
import duckdb
import pyarrow as pa
import traitlets

from mosaic_widget.frame_interop import frame_to_duckdb_registrable
from mosaic_widget.spec_tables import collect_table_filters, resolve_predicates

if TYPE_CHECKING:
    import pandas as pd
    from narwhals.typing import IntoFrame


logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

SLOW_QUERY_THRESHOLD = 5000

_IDENTIFIER_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class MosaicWidget(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "static" / "index.js"
    _css = pathlib.Path(__file__).parent / "static" / "index.css"

    # The Mosaic specification
    spec = traitlets.Dict({}).tag(sync=True)

    # The current params indexed by name
    params = traitlets.Dict({}).tag(sync=True)

    # Where pre-aggregated materialized views should be created
    preagg_schema = traitlets.Unicode().tag(sync=True)

    def __init__(
        self,
        spec: dict | None = None,
        con: duckdb.DuckDBPyConnection | None = None,
        data: dict[str, "IntoFrame"] | None = None,
        *args,
        **kwargs,
    ):
        """Create a Mosaic widget.

        Args:
            spec (dict, optional): The initial Mosaic specification. Defaults to {}.
            con (connection, optional): A DuckDB connection.
                Defaults to duckdb.connect().
            data (dict, optional): DataFrames/Arrow objects to "register" with DuckDB.
                Defaults to {}. Keys are table names, values are objects to register as
                virtual tables (similar to SQL VIEWs). Supports pandas/polars DataFrames
                and other Arrow objects.
        """
        if data is None:
            data = {}
        if spec is None:
            spec = {}
        if con is None:
            con = duckdb.connect()

        super().__init__(*args, **kwargs)
        self.spec = spec
        self.con = con
        self._registered_tables: set[str] = set()
        for name, df in data.items():
            self.con.register(name, frame_to_duckdb_registrable(df))
            self._registered_tables.add(name)
        self.on_msg(self._handle_custom_msg)

    def _handle_custom_msg(self, content: dict, buffers: list) -> None:
        logger.debug(f"{content=}, {buffers=}")
        start = time.time()

        uuid = content["uuid"]
        sql = content["sql"]
        command = content["type"]

        try:
            if command == "arrow":
                result = self.con.query(sql).arrow()
                sink = pa.BufferOutputStream()
                with pa.ipc.new_stream(sink, result.schema) as writer:
                    for batch in result:
                        writer.write(batch)
                buf = sink.getvalue()

                self.send({"type": "arrow", "uuid": uuid}, buffers=[buf.to_pybytes()])
            elif command == "exec":
                self.con.execute(sql)
                self.send({"type": "exec", "uuid": uuid})
            elif command == "json":
                result = self.con.query(sql).df()
                json = result.to_dict(orient="records")
                self.send({"type": "json", "uuid": uuid, "result": json})
            else:
                raise ValueError(f"Unknown command {command}")
        except Exception as e:
            logger.exception("Error processing query")
            self.send({"error": str(e), "uuid": uuid})

        total = round((time.time() - start) * 1_000)
        if total > SLOW_QUERY_THRESHOLD:
            logger.warning(f"DONE. Slow query {uuid} took {total} ms.\n{sql}")
        else:
            logger.info(f"DONE. Query {uuid} took {total} ms.\n{sql}")

    @property
    def sql(self) -> str:
        """SQL for the current interactive state of the (single) source table.

        Combines the live selection ``predicate`` strings on ``params`` into a
        ``WHERE`` clause for the table referenced by the spec. Raises a
        ``ValueError`` if the spec has zero or more than one source table; pass
        a table name to :meth:`data` instead in the multi-table case.
        """
        return self._build_sql(self._resolve_table(None))

    def data(
        self,
        table: str | None = None,
        *,
        filter_by: str | Sequence[str] | None = None,
    ) -> "pd.DataFrame":
        """Return the currently filtered rows for ``table`` as a DataFrame.

        Args:
            table: Source table name. Defaults to the unique table discovered
                in the spec; required when the spec references multiple
                tables.
            filter_by: Optional selection name or sequence of names to limit
                which selection predicates are applied. By default all
                selections used as ``filterBy`` on ``table`` in the spec are
                combined with ``AND``.
        """
        resolved = self._resolve_table(table)
        return self.con.query(self._build_sql(resolved, filter_by=filter_by)).df()

    def _resolve_table(self, table: str | None) -> str:
        tables = collect_table_filters(self.spec)
        if table is not None:
            if table not in tables and table not in self._registered_tables:
                known = sorted(set(tables) | self._registered_tables)
                raise ValueError(
                    f"Table {table!r} not found in spec or registered data; "
                    f"known tables: {known or 'none'}"
                )
            return table
        if not tables:
            raise ValueError(
                "No source tables found in spec; pass a table name to "
                "widget.data(table)."
            )
        if len(tables) > 1:
            raise ValueError(
                f"Spec references multiple source tables: {sorted(tables)}. "
                "Pass a table name to widget.data(table)."
            )
        return next(iter(tables))

    def _build_sql(
        self,
        table: str,
        filter_by: str | Sequence[str] | None = None,
    ) -> str:
        if not _IDENTIFIER_RE.match(table):
            raise ValueError(
                f"Invalid table name {table!r}; expected a simple identifier."
            )
        if filter_by is None:
            names: Sequence[str] = collect_table_filters(self.spec).get(table, [])
        elif isinstance(filter_by, str):
            names = [filter_by]
        else:
            names = list(filter_by)
        predicates = resolve_predicates(self.params, names)
        base = f'SELECT * FROM "{table}"'
        if not predicates:
            return base
        where = " AND ".join(f"({p})" for p in predicates)
        return f"{base} WHERE {where}"
