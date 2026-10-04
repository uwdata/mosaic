from __future__ import annotations

from typing import TYPE_CHECKING, TypeAlias

from pkg.servers import common

if TYPE_CHECKING:
    from _typeshed import Incomplete
    from granian.server.common import AbstractServer as _AbstractServer
    from typing_extensions import Self

    # NOTE: `granian.Granian` is a variable, not a type expression
    Granian: TypeAlias = _AbstractServer[Incomplete]


class GranianServer(common.Server):
    def __init__(self, server: Granian) -> None:
        self._server: Granian = server

    @classmethod
    def from_args(cls, args: common.Args, app: Incomplete, /) -> Self:
        import granian
        import granian.log

        if not isinstance(app, str):
            msg = "TODO @dangotbanned: Granian requires a target string, and does not accept an application object"
            raise NotImplementedError(msg)

        inverted = granian.log.log_levels_map
        log_levels_map = dict(zip(inverted.values(), inverted))
        server = granian.Granian(
            app,
            address=args.address,
            port=args.port,
            ssl_key=args.ssl_key,
            ssl_cert=args.ssl_cert,
            log_level=log_levels_map[args.log_level],
        )
        return cls(server)

    def run(self) -> None:
        self._server.serve()
