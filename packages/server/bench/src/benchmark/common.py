from __future__ import annotations

from pathlib import Path
from typing import Final, NewType
from typing import Literal as L

from rich.console import Console
from typing_extensions import TypeAliasType as Type
from typing_extensions import TypeVar

Group = Type("Group", L["tiny", "histogram / binning", "larger", "complex / realistic"])
ServerName = Type("ServerName", L["rust", "go", "python", "node"])

Requirement = Type("Requirement", L["cargo", "uv", "pnpm", "gcc"] | ServerName)
Port = NewType("Port", int)
Seconds = NewType("Seconds", float)

Arrow = Type("Arrow", L["arrow"])
Exec = Type("Exec", L["exec"])
CT = TypeVar("CT", bound=Arrow | Exec, covariant=True)
"""The type of `Command.type`."""

GROUP_MEMBERS: Final[tuple[Group, ...]] = (
    "tiny",
    "histogram / binning",
    "larger",
    "complex / realistic",
)
BENCHMARK_DIR = Path(__file__).parent
BENCH_DIR = BENCHMARK_DIR.parent.parent
SERVER_DIR = BENCH_DIR.parent
DATA_DIR = (SERVER_DIR.parent.parent / "data").as_posix()
EXPORT_DIR = BENCH_DIR / "export"

console: Final = Console()
