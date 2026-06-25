from __future__ import annotations

import logging
import pathlib
import time

import anywidget
import duckdb
import pyarrow as pa
import traitlets

from mosaic_widget.frame_interop import frame_to_duckdb_registrable
from mosaic_widget.spec_tables import collect_table_filters, resolve_predicates

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
        data: dict | None = None,
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
    def sql(self):
        """
        The SQL query that reflects the current selection state, useful for inspection or logging.
        """
        return self._build_sql(self._resolve_table(None), filter_by=None)

    def data(self, table=None, *, filter_by=None):
        """
        Query the source table filtered by the current selection state.

        Args:
            table (str, optional): The table to query. Required when the spec references
                multiple tables; inferred automatically when there is only one.
            filter_by (str or list, optional): Param name(s) to filter by. Defaults to
                all params associated with the resolved table in the spec.

        Returns:
            A DuckDB relation for the filtered table.
        """
        resolved = self._resolve_table(table)
        return self.con.query(self._build_sql(resolved, filter_by=filter_by))

    def _resolve_table(self, table):
        """
        Resolve a table name against the spec and registered data.
        When table is None and the spec references exactly one table, that table is
        returned automatically. Raises ValueError if the table is ambiguous or unknown.
        """
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

    def _build_sql(self, table, filter_by=None):
        if filter_by is None:
            names = collect_table_filters(self.spec).get(table, [])
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
