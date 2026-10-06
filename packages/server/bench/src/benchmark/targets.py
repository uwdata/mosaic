from __future__ import annotations

from typing import Final

from benchmark.common import SERVER_DIR
from benchmark.config import ServerConfig

TARGETS: Final = (
    ServerConfig(
        "python",
        SERVER_DIR / "duckdb-server",
        depends=("uv",),
        run=("uv", "run", "duckdb-server"),
    ),
    ServerConfig(
        "rust",
        SERVER_DIR / "duckdb-server-rust",
        depends=("cargo", "rust"),
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
