from __future__ import annotations

from typing import TYPE_CHECKING
from typing import Literal as L

import msgspec
import polars as pl
from polars import selectors as cs

from benchmark import _rich
from benchmark.client import Client
from benchmark.common import EXPORT_DIR, GROUP_MEMBERS, console
from benchmark.server import Server

if TYPE_CHECKING:
    from collections.abc import Collection, Sequence
    from pathlib import Path

    from benchmark.common import Exec, Type
    from benchmark.config import CLIOptions, ServerConfig
    from benchmark.task import Benchmark, Command

# NOTE: Probably will replace with a `Reporter` concept
type ResultSummary = dict[L["main", "compare"], pl.DataFrame]


class Runner[T: Type](msgspec.Struct):
    options: CLIOptions
    targets: Sequence[ServerConfig]
    sources: Collection[Command[Exec]]
    benchmarks: Collection[Benchmark[T, None]]
    benchmark_schema: pl.Schema = msgspec.field(default_factory=pl.Schema)

    def __post_init__(self) -> None:
        if not self.benchmark_schema:
            self.benchmark_schema = pl.Schema(
                {
                    "benchmark_group": pl.Enum(GROUP_MEMBERS),
                    "benchmark_name": pl.Enum(b.name for b in self.benchmarks),
                    "command_type": str,
                    "response_size": int,
                    "timings": pl.List(pl.Duration("ns")),
                }
            )

    def run(self, target: ServerConfig) -> pl.LazyFrame:
        opts = self.options
        port = opts.port
        n, warmup, timeout = opts.iterations, opts.warmup, opts.timeout
        console.rule(f"Running {target.link()}")
        with (
            Server.from_config(target, port, debug=opts.debug_server) as server,
            Client(opts.base_url(port), n, warmup, timeout) as client,
        ):
            client.ensure_ok()
            console.print("[green bold]Connected[/]")
            results = (
                result.into_row()
                for result in client.run_benchmarks(self.sources, self.benchmarks)
            )
            schema = self.benchmark_schema
            return pl.LazyFrame(results, schema, orient="row").select(
                pl.lit(server.name).alias("server"), *schema
            )

    def run_all(self) -> ResultSummary:
        results_lazy = pl.union(self.run(target) for target in self.targets)
        summaries = self._summarize_results(results_lazy)
        _report_results(summaries)
        return summaries

    def _summarize_results(self, lf: pl.LazyFrame) -> ResultSummary:
        main = lf.pipe(self._summarize_main)
        pivot = main.pipe(self._compare_medians)
        return dict(zip(("main", "compare"), pl.collect_all((main, pivot))))

    def _summarize_main(self, lf: pl.LazyFrame) -> pl.LazyFrame:
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
        )

    def _compare_medians(self, lf: pl.LazyFrame) -> pl.LazyFrame:
        name = "benchmark_name"
        servers = [target.name for target in self.targets]
        server = "server"
        value = "median"
        lf = lf.select(name, server, value)
        horizontal_median = pl.median(value).name.suffix("_server")
        relative_diff = (pl.col(servers) / cs.ends_with("_server")).name.suffix("_diff")
        return (
            lf.pivot(server, on_columns=servers, index=name, values=value)
            .join(lf.group_by(name).agg(horizontal_median), on=name)
            .with_columns(relative_diff)
            .select(name, *(cs.starts_with(s).round(2) for s in servers))
            .sort(name)
        )


def _report_results(summaries: ResultSummary, prefix: str = "results-") -> None:
    export_dir = _mkdir_gitignore(EXPORT_DIR)
    console.rule("Results")
    with pl.Config(tbl_rows=40, float_precision=2):
        for name, result in summaries.items():
            path = export_dir / f"{prefix}{name}.parquet"
            path.touch()
            result.write_parquet(path)
            console.print(f"Exported to: {_rich.link(path)}")
            console.print(f"{result}\n")


def _mkdir_gitignore(path: Path) -> Path:
    ignore = EXPORT_DIR / ".gitignore"
    if ignore.exists():
        return path
    path.mkdir(exist_ok=True)
    ignore.touch()
    note = "# This directory contains machine-specific benchmark results\n# and should not be checked into version control."
    ignore.write_text(f"{note}\n*\n", "utf-8", newline="\n")
    return path
