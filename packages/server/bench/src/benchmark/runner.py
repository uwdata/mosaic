from __future__ import annotations

from typing import TYPE_CHECKING

import msgspec
import polars as pl

from benchmark.client import Client
from benchmark.common import GROUP_MEMBERS
from benchmark.server import Server

if TYPE_CHECKING:
    from collections.abc import Collection, Iterator, Sequence

    from benchmark.common import Exec, Type
    from benchmark.config import CLIOptions, ServerConfig
    from benchmark.task import Benchmark, Command


SCHEMA = pl.Schema(
    {
        "benchmark_group": pl.Enum(GROUP_MEMBERS),  # provides sort order
        "benchmark_name": str,
        "command_type": str,
        "response_size": int,
        "timings": list[float],
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
            return pl.LazyFrame(results, orient="row", schema=SCHEMA).with_columns(
                server=pl.lit(server.name)
            )

    def _available_targets(self) -> Iterator[ServerConfig]:
        for target in self.targets:
            if target.is_available():
                yield target
            else:
                print(f"Skipping unavailable target: {target.name!r}")

    def run_all(self) -> pl.DataFrame:
        results = (
            pl.union(self.run(target) for target in self._available_targets())
            .sort(pl.nth(0, 1), "server")
            .collect()
        )
        with pl.Config(tbl_rows=100, fmt_table_cell_list_len=5, float_precision=2):
            print(results)
        return results
