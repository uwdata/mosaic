from __future__ import annotations

import socket

import pytest

from benchmark.runner import free_tcp_port_factory


@pytest.fixture
def n_ports() -> int:
    return 5


def test_free_tcp_port_factory(n_ports: int) -> None:
    """Adapted from [anyio](https://github.com/agronholm/anyio/blob/6219807568bd7c32f2c08f923c7d93f95c836127/tests/test_pytest_plugin.py#L782-L810)"""
    find_port = free_tcp_port_factory()
    generated_ports = [find_port() for _ in range(n_ports)]
    for port in generated_ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                # NOTE: There is always a chance that our port is taken before we have a chance to connect
                ...

    assert all(isinstance(port, int) for port in generated_ports)
    assert len(set(generated_ports)) == n_ports
