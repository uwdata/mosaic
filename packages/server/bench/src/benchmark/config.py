from __future__ import annotations

import shutil
from typing import TYPE_CHECKING, Final
from typing import Literal as L

import msgspec

from benchmark import _rich
from benchmark.common import Port, Requirement, Seconds, ServerName

if TYPE_CHECKING:
    from collections.abc import Sequence
    from pathlib import Path

DEFAULT_SERVERS: Final = ("rust", "go", "python", "node")


class CLIOptions(msgspec.Struct, kw_only=True):
    scheme: L["http", "https"] = "http"
    host: L["localhost"] = "localhost"
    port: Port = Port(3000)
    iterations: int = 100
    warmup: int = 5
    debug_server: bool = False
    debug_client: bool = False
    timeout: Seconds = Seconds(30)
    servers: Sequence[ServerName] = DEFAULT_SERVERS

    def base_url(self, port: Port | None = None) -> str:
        return f"{self.scheme}://{self.host}:{(port or self.port)}"


class ServerConfig(msgspec.Struct):
    name: ServerName
    path: Path
    depends: tuple[Requirement, ...]
    run: tuple[str, ...]
    debug: bool = False

    def is_available(self) -> bool:
        return all(shutil.which(dep) for dep in self.depends)

    def missing_depends(self) -> tuple[Requirement, ...]:
        return tuple(dep for dep in self.depends if shutil.which(dep) is None)

    def link(self) -> str:
        return _rich.link(self.path, self.name, bold=True)
