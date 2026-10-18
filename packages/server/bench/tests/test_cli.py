from __future__ import annotations

import argparse
from typing import TYPE_CHECKING, Final

import pytest

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
