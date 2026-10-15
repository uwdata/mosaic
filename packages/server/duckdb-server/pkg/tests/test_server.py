from __future__ import annotations

import time
from functools import partial
from pathlib import Path
from secrets import token_hex
from typing import TYPE_CHECKING

import pytest

from pkg.servers import Args, ResolvedArgs, Url, server

if TYPE_CHECKING:
    from collections.abc import Generator

    from anyio.pytest_plugin import FreePortFactory


@pytest.fixture(
    scope="session",
    params=[partial(Args), partial(Args, reload=True)],
    ids=["default", "reload"],
)
def resolved_args(
    request: pytest.FixtureRequest, free_tcp_port_factory: FreePortFactory
) -> ResolvedArgs:
    """Fixture providing configuration for a server."""
    into_args: partial[Args] = request.param
    free_tcp_port = free_tcp_port_factory()
    return into_args(port=free_tcp_port).resolve()


@pytest.fixture(scope="session")
def server_session(resolved_args: ResolvedArgs) -> Generator[Url]:
    """Runs a real server in separate thread, returns the base url."""
    uvicorn_server = server("uvicorn", resolved_args)
    with uvicorn_server.run_in_thread():
        yield resolved_args.base_url()


# NOTE: reload can't be tested in this way because it relies on signals and the main thread
def test_server_reload(server_session: Url, caplog: pytest.LogCaptureFixture) -> None:
    pkg_dir = Path(__file__).parent.parent
    name = f"important_file_{token_hex(8)}.txt"
    initial_records = caplog.record_tuples
    path = pkg_dir / name
    path.touch()
    time.sleep(0.2)
    diff_records = caplog.record_tuples
    try:
        assert diff_records == initial_records
    finally:
        path.unlink()
