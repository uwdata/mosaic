from __future__ import annotations

from typing import TYPE_CHECKING

import msgspec
import polars as pl

from benchmark.client import Client
from benchmark.common import GROUP_MEMBERS
from benchmark.server import Server
from benchmark.task import Command

if TYPE_CHECKING:
    from collections.abc import Collection, Sequence

    from benchmark.common import Exec, Type
    from benchmark.config import CLIOptions, ServerConfig
    from benchmark.task import Benchmark


SCHEMA = pl.Schema(
    {
        "benchmark_group": pl.Enum(GROUP_MEMBERS),  # provides sort order
        "benchmark_name": str,
        "command_type": str,
        "response_size": int,
        "timings": list[float],
    }
)
LOAD_QUERIES = tuple(
    Command.load_parquet(stem) for stem in ("flights-200k", "athletes", "penguins")
)


class Runner(msgspec.Struct):
    options: CLIOptions
    targets: Sequence[ServerConfig]
    sources: Collection[Command[Exec]]
    benchmarks: Collection[Benchmark[Type, None]]

    def run(self, target: ServerConfig) -> pl.DataFrame | None:
        opts = self.options
        port = opts.port
        n, warmup, timeout = opts.iterations, opts.warmup, opts.timeout
        if not target.is_available():
            print(f"Skipping unavailable {target.name!r}")
            return None
        with (
            Server.from_config(target, port) as server,
            Client(opts.base_url(port), n, warmup, timeout) as client,
        ):
            if not client.is_ready():
                print("ERROR: Server did not start within 30s, skipping.\n")
                return

            print(f"{target.name!r} is ready.")
            results = (
                result.into_row()
                for result in client.run_benchmarks(self.sources, self.benchmarks)
            )
            return pl.DataFrame(results, orient="row", schema=SCHEMA).with_columns(
                server=pl.lit(server.name)
            )

    def run_all(self) -> pl.DataFrame:
        it = (self.run(target) for target in self.targets)
        results = (
            pl.union(x.lazy() for x in it if x is not None)
            .sort(pl.nth(0, 1), "server")
            .collect()
        )
        with pl.Config(tbl_rows=100, fmt_table_cell_list_len=5, float_precision=2):
            print(results)
        return results
