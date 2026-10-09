from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Literal, Protocol, final

import msgspec

if TYPE_CHECKING:
    from _typeshed import Incomplete
    from typing_extensions import Self

DIR_PKG = Path(__file__).parent.parent
DIR_DUCKDB_SERVER = DIR_PKG.parent
KEYFILE = DIR_DUCKDB_SERVER / "localhost-key.pem"
CERTFILE = DIR_DUCKDB_SERVER / "localhost.pem"


@final
class Args(msgspec.Struct):
    database: Path | str = ":memory:"
    """Path of database file (e.g., "database.db". ":memory:" for in-memory database)."""

    address: str = "127.0.0.1"
    """HTTP Address."""

    port: int = 3000
    """HTTP Port."""

    ssl_cert: Path | None = CERTFILE

    ssl_key: Path | None = KEYFILE

    log_level: Literal[0, 10, 20, 30, 40, 50] = logging.DEBUG

    def with_ssl_exists(self) -> Args:
        if (
            (cert := self.ssl_cert)
            and cert.exists()
            and (key := self.ssl_key)
            and key.exists()
        ):
            return self

        # TODO @dangotbanned: Log that paths were not found
        self.ssl_cert = self.ssl_key = None
        return self

    @staticmethod
    def parse() -> Args:
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
        return parser.parse_args(namespace=Args()).with_ssl_exists()


class Server(Protocol):
    @classmethod
    def from_args(cls, args: Args, app: Incomplete, /) -> Self: ...
    def run(self) -> None: ...
