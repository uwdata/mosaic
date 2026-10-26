from __future__ import annotations

from typing import TYPE_CHECKING

from pkg.servers import common

if TYPE_CHECKING:
    from typing import Self

    import uvicorn
    from _typeshed import Incomplete


class UvicornServer(common.Server):
    def __init__(self, server: uvicorn.Server) -> None:
        self._server: uvicorn.Server = server

    @classmethod
    def from_args(cls, args: common.ResolvedArgs, app: Incomplete, /) -> Self:
        import uvicorn

        if ssl := args.ssl:
            http2 = True
            ssl_keyfile = ssl.key
            ssl_certfile = ssl.cert
        else:
            http2 = False
            ssl_keyfile = None
            ssl_certfile = None

        config = uvicorn.Config(
            app,
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
        self._server.run()
