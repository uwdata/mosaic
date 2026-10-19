from __future__ import annotations

import datetime as dt
import time
from http import HTTPStatus
from typing import TYPE_CHECKING

import msgspec
import niquests
from typing_extensions import Self

from benchmark import _rich
from benchmark.common import CT, console
from benchmark.task import Command, Result

if TYPE_CHECKING:
    from collections.abc import Collection, Iterator

    from benchmark.common import Exec, Retries, Seconds
    from benchmark.task import Benchmark

_JSON_ENCODER = msgspec.json.Encoder().encode
_PING = Command("arrow", "SELECT 1")


class Client:
    """A managed session/connection, scoped to a single server."""

    def __init__(
        self,
        base_url: str,
        iterations: int,
        warmup: int,
        timeout: Seconds,
        retries: Retries | None,
    ) -> None:
        self._session = niquests.Session(
            base_url=base_url,
            json_encoder=_JSON_ENCODER,
            timeout=timeout,
            retries=retries.to_urllib3() if retries else 0,
        )
        self.base_url: str = base_url
        self.iterations: int = iterations
        self.warmup: int = warmup

    def __enter__(self) -> Self:
        console.print("Connecting client", style="dim")
        return self

    def __exit__(self, *args: object) -> None:
        self._session.close()
        console.print("Closed client", style="dim")

    def ensure_ok(self) -> None:
        start = time.perf_counter_ns()
        try:
            response = self._session.post("/", json=_PING)
            end = time.perf_counter_ns()
        except niquests.ConnectionError:
            end = time.perf_counter_ns()
            seconds = elapsed_seconds_ns(start, end)
            console.print(f"[red bold]Failed to connect in {seconds}s[/]")
            raise
        console.print(f"[green bold]Connected in {elapsed_seconds_ns(start, end)}s[/]")
        if response.status_code != HTTPStatus.OK:
            response.raise_for_status()

    def post(self, command: Command[CT]) -> bytes:
        response = self._session.post("/", json=command).raise_for_status()
        return response.content or b""

    def _run_benchmark(
        self, benchmark: Benchmark[CT, None], /
    ) -> Benchmark[CT, Result]:
        command = benchmark.command
        counter = time.perf_counter_ns
        response_size = 0

        # Warmup
        for _ in range(self.warmup):
            t0 = counter()
            data = self.post(command)
            t1 = counter()
            (t1 - t0)
            response_size = len(data)

        # Actual
        timings: list[int] = []
        for _ in range(self.iterations):
            t0 = counter()
            self.post(command)
            t1 = counter()
            timings.append(t1 - t0)
        return benchmark.with_result(Result(timings, response_size))

    def run_benchmarks(
        self,
        sources: Collection[Command[Exec]],
        benchmarks: Collection[Benchmark[CT, None]],
        /,
    ) -> Iterator[Benchmark[CT, Result]]:
        # NOTE: This one is too quick to be worth reporting start/end/duration
        for command in sources:
            self.post(command)
        console.print("Data loaded", style="dim")

        for bench in _rich.track(
            benchmarks,
            "Running benchmarks",
            "Finished benchmarks",
            refresh_per_second=4,
            spinner="simpleDotsScrolling",
        ):
            yield self._run_benchmark(bench)


def elapsed_seconds_ns(start_ns: int, end_ns: int, /) -> str:
    """Calculate the delta and format the result as (fractional) seconds.

    Intended for *informational* logging.

    ## See Also
    https://github.com/python/cpython/issues/59648
    """
    diff = end_ns - start_ns
    return str(round(dt.timedelta(microseconds=diff / 1000).total_seconds(), 2))
