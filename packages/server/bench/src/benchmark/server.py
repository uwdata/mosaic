from __future__ import annotations

import subprocess as sp
from typing import TYPE_CHECKING, Self

from benchmark.common import console

if TYPE_CHECKING:
    from types import TracebackType

    from benchmark.common import Port
    from benchmark.config import ServerConfig


type Process = sp.Popen[str]


class Server:
    config: ServerConfig
    port: Port
    _process: Process

    @classmethod
    def from_config(cls, config: ServerConfig, port: Port, *, debug: bool) -> Self:
        self = cls.__new__(cls)
        if debug:
            config = config.__replace__(debug=True)
        self.config = config
        self.port = port
        return self

    @property
    def name(self) -> str:
        return self.config.name

    def __enter__(self) -> Self:
        cfg = self.config
        args = *cfg.run, f"--port {self.port}"
        console.print("$", " ".join(args))
        pipe = None if cfg.debug else sp.DEVNULL
        self._process = sp.Popen(
            args, cwd=cfg.path, text=True, stdout=pipe, stderr=pipe
        ).__enter__()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        console.print("Exiting server")
        if self._process.poll() is None:
            self._process.terminate()
            try:
                self._process.wait(timeout=5)
            except sp.TimeoutExpired:
                self._process.kill()
                self._process.wait()
