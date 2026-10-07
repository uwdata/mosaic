from __future__ import annotations

from pathlib import Path
from typing import Final, NewType, get_args
from typing import Literal as L

type Group = L["tiny", "histogram / binning", "larger", "complex / realistic"]
type ServerName = L["rust", "go", "python", "node"]
type Requirement = L["cargo", "uv", "pnpm", "gcc"] | ServerName
Port = NewType("Port", int)
Seconds = NewType("Seconds", float)

type Arrow = L["arrow"]
type Exec = L["exec"]
type Type = Arrow | Exec

GROUP_MEMBERS: Final[tuple[Group, ...]] = get_args(Group.__value__)
BENCHMARK_DIR = Path(__file__).parent
BENCH_DIR = BENCHMARK_DIR.parent.parent
SERVER_DIR = BENCH_DIR.parent
DATA_DIR = (SERVER_DIR.parent.parent / "data").as_posix()
EXPORT_DIR = BENCH_DIR / "export"
