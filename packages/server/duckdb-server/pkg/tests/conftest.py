from __future__ import annotations

from typing import TYPE_CHECKING

import httpx2
import pytest
from starlette.testclient import TestClient

from pkg.app import create_app
from pkg.servers import Args, server

if TYPE_CHECKING:
    from collections.abc import Generator

    from anyio.pytest_plugin import FreePortFactory


@pytest.fixture(scope="session")
def client_session() -> Generator[TestClient]:
    """Fixture providing a mock client for the starlette app.

    This is suitable for testing the responses from endpoint(s),
    but it does not spin up a real server.
    """
    with TestClient(create_app()) as client:
        # NOTE: context manager ensures that the database is opened
        # https://starlette.dev/lifespan/#running-lifespan-in-tests
        yield client


@pytest.fixture(scope="session")
def real_server_session(
    free_tcp_port_factory: FreePortFactory,
) -> Generator[httpx2.Client]:
    """Fixture providing a real server/client for the starlette app.

    Allows coverage of more complicated paths that `TestClient` cannot reach.
    (https://github.com/Kludex/zttp/issues/286)
    """
    args = Args(port=free_tcp_port_factory()).resolve()
    with (
        server("uvicorn", args).run_in_thread(),
        httpx2.Client(base_url=args.base_url()) as client,
    ):
        yield client
