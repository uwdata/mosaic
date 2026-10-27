from __future__ import annotations

from typing import TYPE_CHECKING
from typing import Literal as L  # ruff: ignore[camelcase-imported-as-acronym]

from pkg.servers.common import Args, ResolvedArgs, Server, Url

if TYPE_CHECKING:
    from pkg.servers._uvicorn import UvicornServer

__all__ = ("Args", "ResolvedArgs", "Server", "Url", "server")


def server(name: L["uvicorn"], args: Args | ResolvedArgs, /) -> UvicornServer:
    if isinstance(args, Args):  # pragma: no cover
        args = args.resolve()
    if name != "uvicorn":
        raise NotImplementedError(name)
    from pkg.servers._uvicorn import UvicornServer

    return UvicornServer.from_args(args, "pkg.app:create_app")
