from __future__ import annotations

from pathlib import Path
from typing import Literal as L
from typing import NewType

type Group = L["tiny", "histogram / binning", "larger", "complex / realistic"]
type ServerName = L["rust", "go", "python", "node"]
type Requirement = L["cargo", "uv", "pnpm", "gcc"] | ServerName
Port = NewType("Port", int)
Seconds = NewType("Seconds", float)

type Arrow = L["arrow"]
type Exec = L["exec"]
type Type = Arrow | Exec


BENCHMARK_DIR = Path(__file__).parent
SERVER_DIR = BENCHMARK_DIR.parent.parent.parent
DATA_DIR = (SERVER_DIR.parent.parent / "data").as_posix()
