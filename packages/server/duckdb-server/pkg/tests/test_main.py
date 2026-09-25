from __future__ import annotations

import pytest

from pkg.__main__ import parse_args


def test_defaults_to_memory_on_port_3000() -> None:
    args = parse_args([])
    assert (args.database, args.port) == (":memory:", 3000)


def test_accepts_database_and_port_in_either_order() -> None:
    assert parse_args(["--port", "4010", "data.db"]).port == 4010
    args = parse_args(["data.db", "-p", "4010"])
    assert (args.database, args.port) == ("data.db", 4010)


@pytest.mark.parametrize("port", ["abc", "70000"])
def test_rejects_invalid_port(port: str) -> None:
    with pytest.raises(SystemExit):
        parse_args(["--port", port])
