from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Final, Literal, Protocol, final

import msgspec
import platformdirs

if TYPE_CHECKING:
    from _typeshed import Incomplete
    from typing_extensions import Self


_DEFAULT_CERT: Final = Path("localhost.pem")
_DEFAULT_KEY: Final = Path("localhost-key.pem")


class _BaseArgs(msgspec.Struct):
    database: Path | str = ":memory:"
    """Path of database file (e.g., "database.db". ":memory:" for in-memory database)."""

    address: str = "127.0.0.1"
    """HTTP Address."""

    port: int = 3000
    """HTTP Port."""

    log_level: Literal[0, 10, 20, 30, 40, 50] = logging.DEBUG


class SSL(msgspec.Struct):
    cert: Path
    key: Path


@final
class ResolvedArgs(_BaseArgs):
    ssl: SSL | None = None


@final
class Args(_BaseArgs):
    ssl_cert: Path = _DEFAULT_CERT
    ssl_key: Path = _DEFAULT_KEY

    def resolve(self) -> ResolvedArgs:
        # NOTE: The number of cases is defined by the Go impl:
        # - the defaults used and exist -> returned
        # - user provided and exist -> returned
        # - the defaults used -> check elsewhere, missing means disable HTTPS & HTTP/2
        # - only one of cert/key provided -> error
        # - user provided and not exist -> error
        db, host, port, level = self.database, self.address, self.port, self.log_level
        cert, key = self.ssl_cert, self.ssl_key
        if cert.is_file() and cert.exists() and key.is_file() and key.exists():
            return ResolvedArgs(db, host, port, level, ssl=SSL(cert, key))

        config = platformdirs.user_config_path(
            appauthor="mosaic", appname="https", roaming=True
        )
        is_cert_default = cert == _DEFAULT_CERT
        is_key_default = key == _DEFAULT_KEY
        if is_cert_default and is_key_default:
            cert, key = config / cert, config / key
            if cert.is_file() and cert.exists() and key.is_file() and key.exists():
                return ResolvedArgs(db, host, port, level, ssl=SSL(cert, key))
            else:
                return ResolvedArgs(db, host, port, level)
        elif is_cert_default ^ is_key_default:
            msg = "both --cert and --key are required for HTTPS"
            raise TypeError(msg)
        elif not (is_cert_default or is_key_default):
            msg = "both --cert and --key do not exist"
            raise TypeError(msg)
        else:
            msg_0 = f"Unhandled case ({is_cert_default=}, {is_key_default=})\n{cert=}\n{key=}"
            raise NotImplementedError(msg_0)

    @staticmethod
    def parse(*_test_args: str) -> Args:
        parser = argparse.ArgumentParser(
            formatter_class=argparse.ArgumentDefaultsHelpFormatter
        )
        parser.add_argument(
            "--database",
            help="Path of database file (e.g., 'database.db'. ':memory:' for in-memory database)",
            default=":memory:",
        )
        parser.add_argument("--address", help="HTTP Address", default="127.0.0.1")
        parser.add_argument("--port", help="HTTP Port", type=int, default=3000)
        parser.add_argument(
            "--cert",
            help="Path to TLS certificate file (enables HTTPS)",
            default=_DEFAULT_CERT,
            dest="ssl_cert",
            type=Path,
        )
        parser.add_argument(
            "--key",
            help="Path to TLS private key file (enables HTTPS)",
            default=_DEFAULT_KEY,
            dest="ssl_key",
            type=Path,
        )
        return parser.parse_args(_test_args or None, namespace=Args())


class Server(Protocol):
    @classmethod
    def from_args(cls, args: ResolvedArgs, app: Incomplete, /) -> Self: ...
    def run(self) -> None: ...
