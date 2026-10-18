from __future__ import annotations

import argparse
from typing import TYPE_CHECKING, Final
from unittest import mock

import pytest

# NOTE: Import needed to bring `@CLIOptions.register_command(...)` into scope
import benchmark.main as _side_effect  # ruff: ignore[unused-import]
from benchmark.cli import CLIOptions

if TYPE_CHECKING:
    import re

parse: Final = CLIOptions.parse_args
"""Parse `*args: str` as command line options."""


def raises_argument_error(*args: str, match: str | re.Pattern[str]) -> None:
    with pytest.raises(argparse.ArgumentError, match=match):
        parse(*args)


def test_command_exists() -> None:
    default = parse()
    valid = parse("build")

    assert default.command is None
    assert valid.command == "build"


def test_command_invalid() -> None:
    raises_argument_error("i_dont_exist", match=r"command.+invalid.+i_dont_exist")


def test_positive_int() -> None:
    result = parse("--iterations", "10", "--warmup", "4")
    assert result.iterations == 10
    assert result.warmup == 4

    raises_argument_error(
        "--iterations", "0", match=r"iterations.+invalid.+positive_int.+'0'"
    )
    raises_argument_error(
        "--warmup", "-10", match=r"warmup.+invalid.+positive_int.+'-10'"
    )

    raises_argument_error(
        "--warmup", "False", match=r"warmup.+invalid.+positive_int.+'False'"
    )


def test_command_dispatch_default() -> None:
    default = parse()
    with mock.patch("benchmark.runner.Runner", autospec=True) as runner:
        default.dispatch()

    runner.assert_called_once()
    runner.assert_has_calls([mock.call().run_all()], any_order=True)


def test_command_dispatch_build() -> None:
    build = parse("build")
    with (
        mock.patch("subprocess.run", autospec=True) as sp_run,
        mock.patch("benchmark.common.console"),
    ):
        build.dispatch()

    sp_run.assert_called()
    for fn_call in sp_run.mock_calls:
        call_args = fn_call.args
        assert len(call_args) == 1
        assert "build:benchmark" in call_args[0]
