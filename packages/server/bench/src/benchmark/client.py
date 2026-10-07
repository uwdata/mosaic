from __future__ import annotations

import time
from http import HTTPStatus
from typing import TYPE_CHECKING, Self

import msgspec
import niquests

from benchmark.task import Command, Result

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

    from benchmark.common import Exec, Seconds, Type
    from benchmark.task import Benchmark

_JSON_ENCODER = msgspec.json.Encoder().encode
_PING = Command.arrow("SELECT 1")


class Client:
    def __init__(
        self, base_url: str, iterations: int, warmup: int, timeout: Seconds
    ) -> None:
        self._session = niquests.Session(
            base_url=base_url, json_encoder=_JSON_ENCODER, timeout=timeout
        )
        self.base_url: str = base_url
        self.iterations: int = iterations
        self.warmup: int = warmup

    def __enter__(self) -> Self:
        print("Starting client")
        return self

    def __exit__(self, *args: object) -> None:
        self._session.close()
        print("Closed client")

    def ensure_ok(self) -> None:
        response = self._session.post("/", json=_PING)
        if response.status_code != HTTPStatus.OK:
            response.raise_for_status()

    def post[T: Type](self, command: Command[T]) -> bytes:
        return self._session.post("/", json=command).content or b""

    def _run_benchmark[T: Type](
        self, benchmark: Benchmark[T, None], /
    ) -> Benchmark[T, Result]:
        command = benchmark.command
        counter = time.perf_counter_ns
        iterations = self.iterations

        t0, t1 = 0.0, 0.0
        data = b""
        response_size = 0

        # Warmup
        for _ in range(self.warmup):
            t0 = counter()
            data = self.post(command)
            t1 = counter()
            (t1 - t0)
            response_size = len(data)

        # Cleanup
        t0, t1 = 0.0, 0.0
        data = b""

        # Actual
        timings: list[int] = []
        for _ in range(iterations):
            t0 = counter()
            data = self.post(command)
            t1 = counter()
            timings.append(t1 - t0)
        return benchmark.with_result(Result(timings, response_size))

    def run_benchmarks[T: Type](
        self,
        sources: Iterable[Command[Exec]],
        benchmarks: Iterable[Benchmark[T, None]],
        /,
    ) -> Iterator[Benchmark[T, Result]]:
        print("Loading test data")
        for command in sources:
            self.post(command)
        print("Data loaded.")

        print("Starting benchmark run")
        for b in benchmarks:
            yield self._run_benchmark(b)

        print("Benchmarks completed.")
