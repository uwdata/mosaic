from __future__ import annotations

from typing import TYPE_CHECKING, Final, Generic, final

import msgspec
from typing_extensions import LiteralString as LS
from typing_extensions import TypeVar

from benchmark.common import CT, DATA_DIR, Arrow, Exec, Group

if TYPE_CHECKING:
    from collections.abc import Sequence


@final
class Command(msgspec.Struct, Generic[CT]):
    """Message sent to the server."""

    type: Final[CT]
    sql: str

    @staticmethod
    def arrow(sql: str) -> Command[Arrow]:
        return Command("arrow", sql)

    @staticmethod
    def load_parquet(stem: LS) -> Command[Exec]:
        return Command(
            "exec",
            f"CREATE OR REPLACE TABLE {stem!r} AS SELECT * FROM read_parquet('{DATA_DIR}/{stem}.parquet')",
        )


@final
class Result(msgspec.Struct):
    """Data recorded per-benchmark."""

    timings: Sequence[int]
    """Per-iteration execution time in nanoseconds."""
    response_size: int
    """Number of bytes returned in a response."""


R = TypeVar("R", Result, None, covariant=True)


@final
class Benchmark(msgspec.Struct, Generic[CT, R]):
    group: Group
    name: str
    command: Final[Command[CT]]
    result: Final[R]

    def with_result(self, result: Result) -> Benchmark[CT, Result]:
        """Return a copy with `result`."""
        return Benchmark(self.group, self.name, self.command, result)

    @staticmethod
    def arrow(group: Group, name: LS, sql: LS) -> Benchmark[Arrow, None]:
        return Benchmark(group, name, Command("arrow", sql), None)

    def into_row(
        self: Benchmark[CT, Result],
    ) -> tuple[Group, str, CT, int, Sequence[float]]:
        return (
            self.group,
            self.name,
            self.command.type,
            self.result.response_size,
            self.result.timings,
        )
