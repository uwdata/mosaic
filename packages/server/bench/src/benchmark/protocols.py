from __future__ import annotations

from typing import TYPE_CHECKING, Final, NewType, Protocol, Self
from typing import Literal as L

if TYPE_CHECKING:
    import subprocess as sp
    from collections.abc import Iterable, Iterator, Sequence
    from pathlib import Path

    from _typeshed import Incomplete

type Group = L["tiny", "histogram / binning", "larger", "complex / realistic"]
type ServerName = L["rust", "go", "python", "node"]
type Requirement = L["cargo", "uv"] | ServerName
Port = NewType("Port", int)
Seconds = NewType("Seconds", float)
type Type = L["arrow", "exec"]


class Command[T: Type](Protocol):
    type: Final[T]
    sql: str


class Result(Protocol):
    timings: Sequence[float]
    """timings_ms"""
    response_size: int
    """reponse bytes length"""


class Benchmark[T: Type, R: (Result, None)](Protocol):
    group: Group
    name: str
    command: Command[T]
    result: R


class CLIOptions(Protocol):
    scheme: L["http", "https"] = "http"
    host: L["localhost"] = "localhost"
    port: Port = Port(3000)
    iterations: int = 100
    warmup: int = 5

    timeout: Seconds = Seconds(30)
    servers: Sequence[ServerName] = ("rust", "go", "python", "node")


class ServerConfig(Protocol):
    path: Path
    depends: tuple[Requirement, ...]
    build: Incomplete | None
    run: Incomplete
    alias: ServerName


class Server(Protocol):
    config: ServerConfig

    def build(self) -> sp.CompletedProcess[str] | None: ...
    def __enter__(self) -> Self: ...
    def __exit__(self, *args: object) -> None: ...


class Client(Protocol):
    def __enter__(self) -> Self: ...
    def __exit__(self, *args: object) -> None: ...
    def post[T: Type](self, command: Command[T]) -> bytes: ...
    def load_data(self, queries: Iterable[Command[L["exec"]]]) -> None: ...
    def is_ready(self) -> bool: ...
    def _run_benchmark[T: Type](
        self, benchmark: Benchmark[T, None], /
    ) -> Benchmark[T, Result]: ...
    def run_benchmarks[T: Type](
        self, benchmarks: Iterable[Benchmark[T, None]], /
    ) -> Iterator[Benchmark[T, Result]]: ...


class Runner(Protocol):
    options: CLIOptions
    configs: Sequence[ServerConfig]
