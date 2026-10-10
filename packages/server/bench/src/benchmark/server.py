from __future__ import annotations

import subprocess as sp
from typing import TYPE_CHECKING

from typing_extensions import Self

from benchmark.common import console

if TYPE_CHECKING:
    from types import TracebackType

    from benchmark.common import Port
    from benchmark.config import ServerConfig


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

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        console.print("Exiting server", style="dim")
        if self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except sp.TimeoutExpired:
                self._process.kill()
                self._process.wait()
