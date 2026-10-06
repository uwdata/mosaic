from __future__ import annotations

import subprocess as sp
from typing import TYPE_CHECKING, Self

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
        args = *cfg.run, f"--port {self.port}"
        print("$", " ".join(args))
        self._process = sp.Popen(
            args, cwd=cfg.path, text=True, stdout=sp.PIPE, stderr=sp.STDOUT
        ).__enter__()
        return self

    # TODO @dangotbanned: Fix this, it never exits
    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        value: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        return self._process.__exit__(exc_type, value, traceback)
