from __future__ import annotations

import logging
import sys

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


def serve() -> None:
    from pkg.servers import Args, server

    args = Args.parse_sys_argv().resolve()
    if ssl := args.ssl:
        logger.info("Using TLS certificate %s", ssl.cert)
    else:
        logger.warning("No keys for HTTPS found")
    server("uvicorn", args).run()


if __name__ == "__main__":
    serve()
