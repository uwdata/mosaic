from __future__ import annotations

from typing import TYPE_CHECKING

from pkg.servers import common

if TYPE_CHECKING:
    import uvicorn
    from _typeshed import Incomplete
    from typing_extensions import Self


class UvicornServer(common.Server):
    def __init__(self, server: uvicorn.Server) -> None:
        self._server: uvicorn.Server = server

    @classmethod
    def from_args(cls, args: common.Args, app: Incomplete, /) -> Self:
        import uvicorn

        config = uvicorn.Config(
            app,
            host=args.address,
            port=args.port,
            http="zttp",
            http2=True,
            ssl_keyfile=args.ssl_key,
            ssl_certfile=args.ssl_cert,
            log_level=args.log_level,
        )
        return cls(uvicorn.Server(config))

    def run(self) -> None:
        self._server.run()
