from __future__ import annotations

from typing import TYPE_CHECKING, Final

from benchmark.common import SERVER_DIR, ServerName, console
from benchmark.config import DEFAULT_SERVERS, ServerConfig

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

_TARGETS: Final = (
    ServerConfig(
        "python",
        SERVER_DIR / "duckdb-server",
        depends=("uv",),
        run=("uv", "run", "duckdb-server"),
    ),
    ServerConfig(
        "rust",
        SERVER_DIR / "duckdb-server-rust",
        depends=("cargo",),
        run=("cargo", "run", "--release"),
    ),
    ServerConfig(
        "node",
        SERVER_DIR / "duckdb",
        depends=("pnpm", "node"),
        run=("pnpm", "run", "server"),
    ),
    ServerConfig(
        "go",
        SERVER_DIR / "duckdb-server-go",
        depends=("go", "gcc"),
        run=("go", "run", "-tags=duckdb_arrow", "."),
    ),
)


def select_targets(names: Iterable[ServerName], /) -> tuple[ServerConfig, ...]:
    unique = set(names)
    if unique != set(DEFAULT_SERVERS):
        targets = (t for t in _TARGETS if t.name in unique)
    else:
        targets = _TARGETS
    return tuple(_skip_unavailable(targets))


def _skip_unavailable(targets: Iterable[ServerConfig], /) -> Iterator[ServerConfig]:
    console.print("Checking server dependencies", style="dim")
    for target in targets:
        if target.is_available():
            console.print(f" ✅  {target.link()} is available")
            yield target
        else:
            console.print(
                f" ❌  {target.link()} requires {', '.join(target.missing_depends())}"
            )
