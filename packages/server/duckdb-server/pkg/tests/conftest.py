from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from starlette.testclient import TestClient

from pkg.app import create_app

if TYPE_CHECKING:
    from collections.abc import Generator


@pytest.fixture(scope="session")
def client_session() -> Generator[TestClient]:
    with TestClient(create_app()) as client:
        # NOTE: context manager ensures that the database is opened
        # https://starlette.dev/lifespan/#running-lifespan-in-tests
        yield client
