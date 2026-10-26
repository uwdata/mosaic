from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import TYPE_CHECKING, Final, Literal, Protocol, final

import msgspec
import platformdirs

if TYPE_CHECKING:
    from typing import Self

    from _typeshed import Incomplete


_DEFAULT_CERT: Final = Path("localhost.pem")
_DEFAULT_KEY: Final = Path("localhost-key.pem")


def user_config_path() -> Path:
    return platformdirs.user_config_path(
        appauthor="mosaic", appname="https", roaming=True
    )


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


def file_exists(path: Path, /) -> bool:
    return path.is_file() and path.exists()


@final
class Args(_BaseArgs):
    ssl_cert: Path = _DEFAULT_CERT
    ssl_key: Path = _DEFAULT_KEY
    no_http2: bool = False
    """Escape hatch to make benchmarking and testing possible."""

    def resolve(self) -> ResolvedArgs:
        db, host, port, level = self.database, self.address, self.port, self.log_level
        if self.no_http2:
            return ResolvedArgs(db, host, port, level)
        cert, key = self.ssl_cert, self.ssl_key
        if file_exists(cert) and file_exists(key):
            return ResolvedArgs(db, host, port, level, ssl=SSL(cert, key))

        config = user_config_path()
        is_cert_default = cert == _DEFAULT_CERT
        is_key_default = key == _DEFAULT_KEY
        if is_cert_default and is_key_default:
            cert, key = config / cert, config / key
            if file_exists(cert) and file_exists(key):
                return ResolvedArgs(db, host, port, level, ssl=SSL(cert, key))
            else:
                return ResolvedArgs(db, host, port, level)
        elif is_cert_default ^ is_key_default:
            msg = "both --cert and --key are required for HTTPS"
            raise TypeError(msg)
        elif not (is_cert_default or is_key_default):
            msg = "both --cert and --key must exist"
            raise TypeError(msg)
        else:
            msg_0 = f"Unhandled case ({is_cert_default=}, {is_key_default=})\n{cert=}\n{key=}"
            raise NotImplementedError(msg_0)

    @classmethod
    def parse_sys_argv(cls) -> Args:
        return cls._parse(None)

    @classmethod
    def parse_args(cls, *args: str) -> Args:
        return cls._parse(args)

    @staticmethod
    def _parse(args: tuple[str, ...] | None, /) -> Args:
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
        parser.add_argument(
            "--no-http2",
            action="store_true",
            help="TEMPORARY FLAG. Required for benchmarks until https://github.com/uwdata/mosaic/pull/1332",
        )
        return parser.parse_args(args, namespace=Args())


class Server(Protocol):
    @classmethod
    def from_args(cls, args: ResolvedArgs, app: Incomplete, /) -> Self: ...
    def run(self) -> None: ...
