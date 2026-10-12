from __future__ import annotations

import logging
import sys

from pkg.app import create_app

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve() -> None:
    from pkg.servers._uvicorn import UvicornServer
    from pkg.servers.common import Args

    args = Args.parse()
    UvicornServer.from_args(args, create_app(args.database)).run()


if __name__ == "__main__":
    serve()
