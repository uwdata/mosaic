from __future__ import annotations

from typing import TYPE_CHECKING, Final, final
from typing import LiteralString as LS

import msgspec

from benchmark.common import DATA_DIR, Arrow, Exec, Group, Type

if TYPE_CHECKING:
    from collections.abc import Sequence


@final
class Command[T: Type](msgspec.Struct):
    type: Final[T]
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
    timings: Sequence[float]
    """timings_ms"""
    response_size: int
    """reponse bytes length"""


@final
class Benchmark[T: Type, R: (Result, None)](msgspec.Struct):
    group: Group
    name: str
    command: Final[Command[T]]
    result: Final[R]

    def with_result(self, result: Result) -> Benchmark[T, Result]:
        return Benchmark(self.group, self.name, self.command, result)

    @staticmethod
    def arrow(group: Group, name: LS, sql: LS) -> Benchmark[Arrow, None]:
        return Benchmark(group, name, Command("arrow", sql), None)

    def into_row(
        self: Benchmark[T, Result],
    ) -> tuple[Group, str, T, int, Sequence[float]]:
        return (
            self.group,
            self.name,
            self.command.type,
            self.result.response_size,
            self.result.timings,
        )
