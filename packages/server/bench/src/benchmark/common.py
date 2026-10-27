from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Final, NewType
from typing import Literal as L

import msgspec
from rich.console import Console
from typing_extensions import TypeAliasType as Type
from typing_extensions import TypeVar

if TYPE_CHECKING:
    from urllib3 import Retry
else:
    # NOTE: the typing of `Retry/RetryType` is broken https://niquests.readthedocs.io/en/latest/api.html#niquests.RetryConfiguration
    from urllib3_future import Retry

Group = Type("Group", L["tiny", "histogram / binning", "larger", "complex / realistic"])
ServerName = Type("ServerName", L["rust", "go", "python", "node"])

Requirement = Type("Requirement", L["cargo", "uv", "pnpm", "gcc"] | ServerName)
Host = Type("Host", L["localhost", "127.0.0.1"])
Port = NewType("Port", int)
"""Each server is provided a unique, available port."""
Seconds = NewType("Seconds", float)

Arrow = Type("Arrow", L["arrow"])
Exec = Type("Exec", L["exec"])
CT = TypeVar("CT", bound=Arrow | Exec, covariant=True)
"""The type of `Command.type`."""

GROUP_MEMBERS: Final = ("tiny", "histogram / binning", "larger", "complex / realistic")
DEFAULT_SERVERS: Final = ("rust", "go", "python", "node")

BENCHMARK_DIR = Path(__file__).parent
BENCH_DIR = BENCHMARK_DIR.parent.parent
SERVER_DIR = BENCH_DIR.parent
DATA_DIR = (SERVER_DIR.parent.parent / "data").as_posix()
EXPORT_DIR = BENCH_DIR / "export"

console: Final = Console()


class Retries(msgspec.Struct, kw_only=True):
    """Retry policy.

    *Docs adapted from [urllib3.util.Retry][1]*.

    [1]: https://urllib3future.readthedocs.io/en/latest/reference/urllib3.util.html#urllib3.util.Retry
    """

    connect: int = 5
    """How many connection-related errors to retry on.
    
    These are errors raised before the request is sent to the server,
    which we assume has not triggered the server to process the request.
    """

    backoff_factor: float = 0.2
    """A backoff factor to apply between attempts after the 2nd try.
    
    urllib3 will sleep for:
    ```py
    seconds = backoff_factor * (2 ** number_of_previous_retries)
    ```

    For example, with `0.1`, each sleep will grow as follows:
    ```py
    0.0, 0.2, 0.4, 0.8, ...
    ```
    """

    def to_urllib3(self) -> Retry:
        """Convert this config into an actual `Retry` object.

        Allows instances of `Retries` to be defined in global scope, without
        recording a history like `Retry`.
        """
        return Retry(
            allowed_methods=frozenset(("POST",)),
            total=None,
            connect=self.connect,
            backoff_factor=self.backoff_factor,
        )
