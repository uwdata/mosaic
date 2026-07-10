from __future__ import annotations

import logging
import pathlib
import time
import warnings
from typing import TYPE_CHECKING

import anywidget
import duckdb
import pyarrow as pa
import traitlets

from mosaic_widget.frame_interop import frame_to_duckdb_registrable

if TYPE_CHECKING:
    from narwhals.typing import IntoFrame


logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())

SLOW_QUERY_THRESHOLD = 5000


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
        data: dict[str, IntoFrame] | None = None,
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
    def sql(self) -> str | None:
        """
        The SQL query that reflects the current selection state.

        Returns None (with a warning) when the source table cannot be inferred,
        i.e. when the widget knows zero or multiple tables. In that case use
        `widget.data(table).sql_query()` to get the SQL for a specific table.
        """
        try:
            table = self._resolve_table(None)
        except ValueError as err:
            warnings.warn(f"{err} widget.sql is None.", stacklevel=2)
            return None
        return self._build_sql(table, filter_by=None)

    def data(
        self, table: str | None = None, *, filter_by: str | list[str] | None = None
    ) -> duckdb.DuckDBPyRelation:
        """
        Query a source table filtered by the current selection state.

        Args:
            table (str, optional): The table to query. Required when the widget
                knows more than one table; inferred when there is exactly one
                (from the spec's top-level `data` entries and the frames
                registered via the `data` constructor argument).
            filter_by (str or list, optional): Selection name(s) to filter by,
                with or without the leading "$". Defaults to all active
                selections.

        Returns:
            A lazy DuckDB relation for the filtered table. Materialize it with
            `.df()` (pandas), `.pl()` (polars), `.arrow()`, or `.fetchall()`.
        """
        return self.con.query(self._build_sql(self._resolve_table(table), filter_by))

    def _resolve_table(self, table: str | None) -> str:
        if table is not None:
            return table
        tables = set(self.spec.get("data") or ()) | self._registered_tables
        if len(tables) == 1:
            return next(iter(tables))
        if not tables:
            raise ValueError(
                "No source tables known; pass a table name to widget.data(table)."
            )
        raise ValueError(
            f"Multiple source tables: {sorted(tables)}. "
            "Pass a table name to widget.data(table)."
        )

    def _build_sql(self, table: str, filter_by: str | list[str] | None) -> str:
        if filter_by is None:
            names = list(self.params)
        else:
            names = [
                name.removeprefix("$")
                for name in ([filter_by] if isinstance(filter_by, str) else filter_by)
            ]
            if unknown := sorted(set(names) - set(self.params)):
                raise ValueError(
                    f"Unknown selection(s) {unknown}; "
                    f"available params: {sorted(self.params)}"
                )
        predicates = [
            predicate
            for name in names
            if (predicate := self.params[name].get("predicate", "")).strip()
        ]
        base = f'SELECT * FROM "{table}"'
        if not predicates:
            return base
        return f"{base} WHERE {' AND '.join(f'({p})' for p in predicates)}"
