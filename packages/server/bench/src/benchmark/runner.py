from __future__ import annotations

from typing import TYPE_CHECKING

import msgspec
import polars as pl
from polars import selectors as cs

from benchmark.client import Client
from benchmark.common import GROUP_MEMBERS
from benchmark.server import Server

if TYPE_CHECKING:
    from collections.abc import Collection, Sequence

    from benchmark.common import Exec, Type
    from benchmark.config import CLIOptions, ServerConfig
    from benchmark.task import Benchmark, Command


SCHEMA_INTO_ROW = pl.Schema(
    {
        "benchmark_group": pl.Enum(GROUP_MEMBERS),  # provides sort order
        "benchmark_name": str,
        "command_type": str,
        "response_size": int,  # bytes
        "timings": pl.List(pl.Duration("ns")),
    }
)


class Runner(msgspec.Struct):
    options: CLIOptions
    targets: Sequence[ServerConfig]
    sources: Collection[Command[Exec]]
    benchmarks: Collection[Benchmark[Type, None]]

    def run(self, target: ServerConfig) -> pl.LazyFrame:
        opts = self.options
        port = opts.port
        n, warmup, timeout = opts.iterations, opts.warmup, opts.timeout
        with (
            Server.from_config(target, port, debug=opts.debug_server) as server,
            Client(opts.base_url(port), n, warmup, timeout) as client,
        ):
            client.ensure_ok()
            print(f"{target.name!r} is ready.")
            results = (
                result.into_row()
                for result in client.run_benchmarks(self.sources, self.benchmarks)
            )
            schema = SCHEMA_INTO_ROW
            return pl.LazyFrame(results, schema, orient="row").select(
                pl.lit(server.name).alias("server"), *schema
            )

    def run_all(self) -> pl.DataFrame:
        results_lazy = pl.union(self.run(target) for target in self.targets)
        results_eager = self._summarize_results(results_lazy)
        with pl.Config(tbl_rows=40, float_precision=3):
            print(results_eager)
        return results_eager

    def _summarize_results(self, lf: pl.LazyFrame) -> pl.DataFrame:
        t = pl.col("timings")
        return (
            lf.select(
                "server",
                cs.starts_with("benchmark"),
                "response_size",
                min=t.list.min(),
                median=t.list.median(),
                p95=t.list.agg(pl.element().quantile(0.95)),
                mean=t.list.mean(),
            )
            .with_columns(cs.duration().dt.total_milliseconds(fractional=True))
            .sort(cs.starts_with("benchmark"), "server")
            .collect()
        )
