from __future__ import annotations

import contextlib
import sys
import threading
import time
from pathlib import Path
from typing import TYPE_CHECKING

from pkg.servers import common

if TYPE_CHECKING:
    from collections.abc import Generator

    import uvicorn
    from typing_extensions import LiteralString, Self


class UvicornServer(common.Server):
    def __init__(self, server: uvicorn.Server) -> None:
        self._server: uvicorn.Server = server

    @classmethod
    def from_args(
        cls, args: common.ResolvedArgs, app_factory_path: LiteralString, /
    ) -> Self:
        import uvicorn

        if ssl := args.ssl:
            http2 = True
            ssl_keyfile = ssl.key
            ssl_certfile = ssl.cert
        else:
            http2 = False
            ssl_keyfile = None
            ssl_certfile = None
        if reload := args.reload:
            pkg = Path(__file__).parent.parent
            reload_dirs = pkg.as_posix()
        else:
            reload_dirs = None

        config = uvicorn.Config(
            app_factory_path,
            factory=True,
            reload=reload,
            reload_dirs=reload_dirs,
            host=args.address,
            port=args.port,
            http="zttp",
            http2=http2,
            ssl_keyfile=ssl_keyfile,
            ssl_certfile=ssl_certfile,
            log_level=args.log_level,
        )
        return cls(uvicorn.Server(config))

    def run(self) -> None:
        from uvicorn.config import STARTUP_FAILURE
        from uvicorn.supervisors import ChangeReload
        # NOTE: Adapted from https://github.com/Kludex/uvicorn/blob/07bd5d4c94c093960de94d1c96000fb0fa029f13/uvicorn/main.py#L625-L651

        server = self._server
        config = server.config
        reload = config.reload

        if reload:
            runner = ChangeReload(config, server.run, sockets=[config.bind_socket()])
        else:
            runner = server
        with contextlib.suppress(KeyboardInterrupt):
            runner.run()

        if not server.started and not reload:
            sys.exit(STARTUP_FAILURE)

    @contextlib.contextmanager
    def run_in_thread(self) -> Generator[None]:
        # https://github.com/Kludex/uvicorn/discussions/1103?sort=top#discussioncomment-941726
        # `ValueError: signal only works in main thread of the main interpreter`
        # Means that `--reload` cannot be tested in this way
        thread = threading.Thread(target=self.run)
        with _dont_capture_signals(self._server) as server:
            thread.start()
            try:
                while not server.started:
                    time.sleep(0.001)
                yield
            finally:
                server.should_exit = True
                thread.join()


@contextlib.contextmanager
def _dont_capture_signals(self: uvicorn.Server) -> Generator[uvicorn.Server]:
    capture_signals = self.capture_signals
    self.capture_signals = contextlib.nullcontext  # ty: ignore[invalid-assignment]
    try:
        yield self
    finally:
        self.capture_signals = capture_signals  # ty: ignore[invalid-assignment]
