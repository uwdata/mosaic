from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from pkg.app import create_app


@pytest.fixture(scope="session")
def client_session() -> TestClient:
    return TestClient(create_app())
