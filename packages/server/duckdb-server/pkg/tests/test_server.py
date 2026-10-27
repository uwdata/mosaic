from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

import pytest

from pkg.db import Database
from pkg.servers import Args, server
from pkg.servers.common import ENV_DB_PATH, IN_MEMORY_DB_NAME

if TYPE_CHECKING:
    from pathlib import Path


def test_database_from_env_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv(ENV_DB_PATH, raising=False)
    assert Database.from_env().path == IN_MEMORY_DB_NAME


def test_database_from_env_path(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    path = str(tmp_path / "test.db")
    monkeypatch.setenv(ENV_DB_PATH, path)
    assert Database.from_env().path == path


def test_reload_config() -> None:
    uvicorn_server = server("uvicorn", Args(reload=True, no_http2=True))
    assert uvicorn_server._server.config.reload
    assert uvicorn_server._server.config.reload_dirs


def test_run_reload(monkeypatch: pytest.MonkeyPatch) -> None:
    import uvicorn.supervisors

    change_reload = MagicMock()
    monkeypatch.setattr(uvicorn.supervisors, "ChangeReload", change_reload)
    uvicorn_server = server("uvicorn", Args(reload=True, no_http2=True))
    monkeypatch.setattr(uvicorn_server._server.config, "bind_socket", MagicMock())
    uvicorn_server.run()
    change_reload.return_value.run.assert_called_once_with()


def test_run_startup_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    uvicorn_server = server("uvicorn", Args(no_http2=True))
    monkeypatch.setattr(uvicorn_server._server, "run", MagicMock())
    with pytest.raises(SystemExit) as excinfo:
        uvicorn_server.run()
    assert excinfo.value.code == 3
