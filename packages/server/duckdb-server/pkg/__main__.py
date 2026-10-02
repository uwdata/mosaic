from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

import msgspec
import uvicorn

from pkg.app import create_app

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


DIR_PKG = Path(__file__).parent
DIR_DUCKDB_SERVER = DIR_PKG.parent
KEYFILE = DIR_DUCKDB_SERVER / "localhost-key.pem"
CERTFILE = DIR_DUCKDB_SERVER / "localhost.pem"


class Args(msgspec.Struct):
    database: Path | str = ":memory:"
    """Path of database file (e.g., "database.db". ":memory:" for in-memory database)."""

    address: str = "127.0.0.1"
    """HTTP Address."""

    port: int = 3000
    """HTTP Port."""

    reload: bool = False


def serve() -> None:
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    parser.add_argument(
        "--database",
        help="Path of database file (e.g., 'database.db'. ':memory:' for in-memory database).",
        default=":memory:",
    )
    parser.add_argument("--address", help="HTTP Address.", default="127.0.0.1")
    parser.add_argument("--port", help="HTTP Port.", type=int, default=3000)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args(namespace=Args())
    if reload := args.reload:
        reload_includes = "*.py"
    else:
        reload_includes = None
    if KEYFILE.exists() and CERTFILE.exists():
        ssl_keyfile = KEYFILE
        ssl_certfile = CERTFILE
    else:
        ssl_keyfile = None
        ssl_certfile = None

    config = uvicorn.Config(
        # I need to use a global and then a string here if I want reload
        # One way to "simplify" is `database` being a env variable
        # Don't like either option
        create_app(args.database),
        host=args.address,
        port=args.port,
        http="zttp",
        http2=True,
        ssl_keyfile=ssl_keyfile,
        ssl_certfile=ssl_certfile,
        log_level=logging.DEBUG,
        reload=reload,
        # NOTE: Needs to be passed to trigger a warning when config elsewhere is wrong
        reload_includes=reload_includes,
    )
    server = uvicorn.Server(config)
    server.run()


if __name__ == "__main__":
    serve()
