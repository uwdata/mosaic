from __future__ import annotations

import shutil
import subprocess as sp
from typing import TYPE_CHECKING

import msgspec
from typing_extensions import Self

from benchmark import _rich
from benchmark.common import console

if TYPE_CHECKING:
    from pathlib import Path

    from benchmark.common import Port, Requirement, ServerName


class ServerConfig(msgspec.Struct):
    """How to start a server."""

    name: ServerName
    """An identifier for reporting."""
    path: Path
    """The path to the package."""
    depends: tuple[Requirement, ...]
    """Refuse to start the server without these requirements."""
    run: tuple[str, ...]
    """The command that starts the server.
    
    For example, if the CLI looks like:
    ```bash
    $ pnpm run server
    ```

    Then `run` should be:
    ```py
    ("pnpm", "run", "server")
    ```
    """

    def is_available(self) -> bool:
        return all(shutil.which(dep) for dep in self.depends)

    def missing_depends(self) -> tuple[Requirement, ...]:
        return tuple(dep for dep in self.depends if shutil.which(dep) is None)

    def link(self) -> str:
        return _rich.link(self.path, self.name, bold=True)


class Server:
    """A managed subprocess, connected to `ServerConfig`."""

    config: ServerConfig
    port: Port
    _process: sp.Popen[str]

    @classmethod
    def from_config(cls, config: ServerConfig, port: Port) -> Self:
        self = cls.__new__(cls)
        self.config = config
        self.port = port
        return self

    @property
    def name(self) -> str:
        return self.config.name

    def __enter__(self) -> Self:
        cfg = self.config
        args = *cfg.run, "--port", f"{self.port}"
        console.print(" ".join(("$", *args)), style="bold")
        self._process = sp.Popen(
            args, cwd=cfg.path, text=True, stdout=sp.DEVNULL, stderr=sp.DEVNULL
        ).__enter__()
        return self

    def __exit__(self, *args: object) -> None:
        console.print("Exiting server", style="dim")
        if self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except sp.TimeoutExpired:
                self._process.kill()
                self._process.wait()
