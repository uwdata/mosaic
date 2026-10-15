from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from starlette.testclient import TestClient

from pkg.app import create_app

if TYPE_CHECKING:
    from collections.abc import Generator


@pytest.fixture(scope="session")
def client_session() -> Generator[TestClient]:
    """Fixture providing a mock client for the starlette app.

    This is suitable for testing the responses from endpoint(s),
    but it does not spin up a real server.
    See `tests/test_server.py` for that guy.
    """
    with TestClient(create_app()) as client:
        # NOTE: context manager ensures that the database is opened
        # https://starlette.dev/lifespan/#running-lifespan-in-tests
        yield client
