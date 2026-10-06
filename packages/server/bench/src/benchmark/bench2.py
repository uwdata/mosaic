from __future__ import annotations

import argparse
import dataclasses
import subprocess as sp
import time
from pathlib import Path
from typing import TYPE_CHECKING, Final, NewType, Protocol, Self, final
from typing import Literal as L
from typing import LiteralString as LS

import msgspec
import niquests
import polars as pl

if TYPE_CHECKING:
    from collections.abc import Iterator, Sequence


type ServerName = L["rust", "go", "python", "node"]
type Requirement = L["cargo", "uv"] | ServerName
Port = NewType("Port", int)
Seconds = NewType("Seconds", float)


BENCH_DIR = Path(__file__).parent
SERVER_DIR = BENCH_DIR.parent
DATA_DIR = (SERVER_DIR.parent.parent / "data").as_posix()


RESULT_SCHEMA = pl.Schema(
    {
        "benchmark_group": str,
        "benchmark_name": str,
        "command_type": str,
        "response_size": int,
        "timings": list[float],
    }
)


class Command(msgspec.Struct):
    type: L["arrow", "exec"]
    sql: str

    @staticmethod
    def arrow(sql: str) -> Command:
        return Command("arrow", sql)

    @classmethod
    def load_parquet(cls, stem: LS) -> Command:
        return cls(
            "exec",
            f"CREATE OR REPLACE TABLE {stem!r} AS SELECT * FROM read_parquet('{DATA_DIR}/{stem}.parquet')",
        )


class Result(msgspec.Struct):
    timings: Sequence[float]
    """timings_ms"""
    response_size: int
    """reponse bytes length"""


type Group = L["tiny", "histogram / binning", "larger", "complex / realistic"]


@final
class Benchmark[R: (Result, None) = None](msgspec.Struct):
    group: Group
    name: str
    command: Command
    result: Final[R]

    @property
    def label(self) -> str:
        return f"{self.name} [{self.command.type}]"

    def with_result(self, result: Result) -> Benchmark[Result]:
        return Benchmark(self.group, self.name, self.command, result)

    @staticmethod
    def arrow(group: Group, name: LS, sql: LS) -> Benchmark:
        return Benchmark(group, name, Command("arrow", sql), None)

    def into_row(
        self: Benchmark[Result],
    ) -> tuple[Group, str, L["arrow", "exec"], int, Sequence[float]]:
        return (
            self.group,
            self.name,
            self.command.type,
            self.result.response_size,
            self.result.timings,
        )


t: pl.Expr = pl.col.timings

t_min = t.min().alias("min")
t_med = t.median().alias("median")
t_p95 = t.quantile(0.95).alias("min")
t_mean = t.mean().alias("min")


LOAD_QUERIES = tuple(
    Command.load_parquet(stem) for stem in ("flights-200k", "athletes", "penguins")
)

_PING = Command.arrow("SELECT 1")


BENCHMARKS = (
    Benchmark.arrow("tiny", "scalar", "SELECT 1 AS x"),
    Benchmark.arrow("tiny", "aggregate: count", "SELECT count(*) AS cnt FROM flights"),
    Benchmark.arrow(
        "tiny",
        "aggregate: min/max",
        "SELECT min(delay) AS lo, max(delay) AS hi FROM flights",
    ),
    Benchmark.arrow(
        "tiny",
        "filtered aggregate",
        "SELECT count(*) AS cnt, avg(delay) AS mean_delay FROM flights WHERE distance > 1000 AND delay > 0",
    ),
    Benchmark.arrow(
        "tiny",
        "group-by small: species",
        "SELECT species, count(*) AS cnt, avg(body_mass) AS mean_mass FROM penguins GROUP BY species",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "histogram: delay bins",
        "SELECT (10 * floor(delay / 10.0)) AS bin, count(*) AS cnt FROM flights WHERE delay BETWEEN -60 AND 180 GROUP BY bin ORDER BY bin",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "group-by: distance stats",
        "SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay, min(delay) AS lo, max(delay) AS hi FROM flights GROUP BY distance ORDER BY cnt DESC",
    ),
    Benchmark.arrow(
        "histogram / binning",
        "2d-bin: heatmap",
        "SELECT floor(time / 100.0) AS time_bin, (20 * floor(delay / 20.0)) AS delay_bin, count(*) AS cnt FROM flights WHERE delay BETWEEN -60 AND 180 GROUP BY time_bin, delay_bin",
    ),
    Benchmark.arrow("larger", "scan: 1k rows", "SELECT * FROM flights LIMIT 1000"),
    Benchmark.arrow("larger", "scan: 10k rows", "SELECT * FROM flights LIMIT 10000"),
    Benchmark.arrow("larger", "full table: athletes", "SELECT * FROM athletes"),
    Benchmark.arrow(
        "complex / realistic",
        "M4-style: time-series",
        (
            "WITH input AS MATERIALIZED (SELECT time, delay FROM flights WHERE distance > 500) "
            "SELECT min(time) AS x, arg_min(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
            "UNION ALL "
            "SELECT max(time) AS x, arg_max(delay, time) AS y FROM input GROUP BY floor(time / 50.0) "
            "ORDER BY x"
        ),
    ),
    Benchmark.arrow(
        "complex / realistic",
        "CTE + window: running avg",
        (
            "WITH by_dist AS (SELECT distance, count(*) AS cnt, avg(delay) AS mean_delay FROM flights GROUP BY distance) "
            "SELECT distance, cnt, avg(cnt) OVER (ORDER BY distance ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_avg "
            "FROM by_dist ORDER BY distance"
        ),
    ),
)


@dataclasses.dataclass(slots=True, kw_only=True)
class Options:
    host: L["localhost"] = "localhost"
    port: Port = Port(3000)
    iterations: int = 100
    warmup: int = 5
    servers: Sequence[ServerName] = ("rust", "go", "python", "node")
    timeout: Seconds = Seconds(30)


class Server(Protocol):
    name: ServerName
    requires: tuple[Requirement, ...]
    path: Path
    process: sp.Popen[str] | None

    def build(self) -> sp.CompletedProcess[str] | None: ...

    def start(self, port: Port, /) -> sp.Popen[str] | None: ...
    def stop(self, process: sp.Popen[str], /) -> None:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=5)
            except sp.TimeoutExpired:
                process.kill()
                process.wait()

    def run(self, options: Options) -> pl.DataFrame | None:
        if (build_result := self.build()) and build_result.returncode != 0:
            print(f"Build failed:\n{build_result.stderr}")
            return None

        port = options.port

        if (process := self.start(port)) is None:
            print("Start failed, skipping.\n")
            return None

        results: pl.DataFrame | None = None

        try:
            print(f"Waiting for server on port {port} ...")
            with Client("http", options) as client:
                if client.is_ready():
                    print("Server is ready.\n")
                    results = pl.DataFrame(
                        (result.into_row() for result in client.run_benchmarks()),
                        orient="row",
                        schema=RESULT_SCHEMA,
                    ).with_columns(server=pl.lit(self.name))

                else:
                    print("ERROR: Server did not start within 30s, skipping.\n")

        finally:
            self.stop(process)

        return results


# TODO @dangotbanned: Replace with a builder API
# `Server(<path>).requires(<dependencies>).command_build(<...>).command_run(<...>)`
class Python(Server):
    name = "python"
    requires = ("uv",)
    path = SERVER_DIR / "duckdb-server"


class Client:
    __slots__ = ("_session", "iterations", "warmup")
    _session: niquests.Session
    iterations: int
    warmup: int

    def __init__(self, scheme: L["http", "https"], options: Options) -> None:
        base_url = f"{scheme}://{options.host}:{options.port}"

        self._session = niquests.Session(
            base_url=base_url, json_encoder=json_encoder, timeout=options.timeout
        )
        self.iterations = options.iterations
        self.warmup = options.warmup

    @property
    def base_url(self) -> str:
        return self._session.base_url or ""

    def __enter__(self) -> Self:
        return self

    def __exit__(self, *args: object) -> None:
        self._session.close()

    def is_ready(self) -> bool:
        return self._session.post("/", json=_PING).ok

    def post(self, command: Command) -> bytes:
        return self._session.post("/", json=command).raise_for_status().content or b""

    def _load(self) -> None:
        # Load data
        print("Loading test data ...")
        for command in LOAD_QUERIES:
            self.post(command)
        print("Data loaded.\n")

    def _benchmark(self, b: Benchmark) -> Benchmark[Result]:
        thousand = 1000
        command = b.command
        counter = time.perf_counter
        iterations = self.iterations

        t0, t1 = 0.0, 0.0
        data = b""
        resp_size = 0

        # Warmup
        for _ in range(self.warmup):
            t0 = counter()
            data = self.post(command)
            t1 = counter()
            (t1 - t0) * thousand
            resp_size = len(data)

        # Cleanup
        t0, t1 = 0.0, 0.0
        data = b""
        resp_size = 0

        # Actual
        timings: list[float] = []
        for _ in range(iterations):
            t0 = counter()
            data = self.post(command)
            t1 = counter()

            timings.append((t1 - t0) * thousand)
            resp_size = len(data)

        return b.with_result(Result(timings, resp_size))

    def run_benchmarks(self) -> Iterator[Benchmark[Result]]:
        self._load()
        for b in BENCHMARKS:
            yield self._benchmark(b)


json_encoder = msgspec.json.Encoder().encode


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Mosaic Server Benchmark",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("-p", "--port", type=int, default=3000)
    parser.add_argument("-n", "--iterations", type=int, default=100)
    parser.add_argument("-w", "--warmup", type=int, default=5)
    parser.add_argument(
        "-s",
        "--servers",
        nargs="*",
        choices=("rust", "go", "python", "node"),
        default=("rust", "go", "python", "node"),
        help="Comma-separated list of servers. "
        "If omitted, auto-detects available runtimes.",
    )
    args = parser.parse_args(namespace=Options())

    if args.iterations < 1:
        parser.error("--iterations must be >= 1")

    # TODO @dangotbanned: Add a `Runner` concept
    # `Client` and `Server` shouldn't be able to see eachother


if __name__ == "__main__":
    main()
