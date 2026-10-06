from __future__ import annotations

from typing import TYPE_CHECKING

import polars as pl

from benchmark.client import Client
from benchmark.server import Server

if TYPE_CHECKING:
    from collections.abc import Collection, Sequence

    from benchmark.common import Exec, Type
    from benchmark.config import CLIOptions, ServerConfig
    from benchmark.task import Benchmark, Command

SCHEMA = pl.Schema(
    {
        "benchmark_group": str,
        "benchmark_name": str,
        "command_type": str,
        "response_size": int,
        "timings": list[float],
    }
)


class Runner:
    options: CLIOptions
    configs: Sequence[ServerConfig]
    sources: Collection[Command[Exec]]
    benchmarks: Collection[Benchmark[Type, None]]

    def run(self, config: ServerConfig) -> pl.DataFrame | None:
        opts = self.options
        port = opts.port
        n, warmup, timeout = opts.iterations, opts.warmup, opts.timeout
        if not config.is_available():
            print(f"Skipping unavailable {config.name!r}")
            return None
        with (
            Server.from_config(config, port) as server,
            Client(opts.base_url(port), n, warmup, timeout) as client,
        ):
            if not client.is_ready():
                print("ERROR: Server did not start within 30s, skipping.\n")
                return

            print("Server is ready.\n")
            results = (
                result.into_row()
                for result in client.run_benchmarks(self.sources, self.benchmarks)
            )
            return pl.DataFrame(results, orient="row", schema=SCHEMA).with_columns(
                server=pl.lit(server.name)
            )
