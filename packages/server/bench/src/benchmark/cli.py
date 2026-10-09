from __future__ import annotations

import argparse as _argparse
from typing import Any

from benchmark.config import DEFAULT_SERVERS, CLIOptions


class _HelpFormatter(
    _argparse.RawDescriptionHelpFormatter,
    _argparse.ArgumentDefaultsHelpFormatter,
):
    # NOTE: `start_section`, `add_usage` force all headings to be capitilized
    def start_section(self, heading: str | None) -> None:
        super().start_section(_title.capitalize() if (_title := heading) else heading)

    def add_usage(
        self,
        usage: str | None,
        actions: Any,
        groups: Any,
        prefix: str | None = "Usage: ",
    ) -> None:
        if prefix in {"", "usage: "}:
            prefix = "Usage: "
        return super().add_usage(usage, actions, groups, prefix)

    # NOTE: A fixed version of `MetavarTypeHelpFormatter` which doesn't blow up when `Action.type is None`
    # https://github.com/python/cpython/blob/5a22a62b96a68c2dd31784c5e3427ad7b365388a/Lib/argparse.py#L877-L889
    def _get_default_metavar_for_optional(self, action: _argparse.Action) -> str:
        if action_type := action.type:
            if isinstance(action_type, type):
                return action_type.__name__
            if isinstance(action_type, str):
                return action_type
        return ""

    get_default_metavar_for_positional = _get_default_metavar_for_optional


def arg_parser(entrypoint_name: str, /, description: str) -> _argparse.ArgumentParser:
    """Create an `ArgumentParser` inspired by `cargo`, `uv`, `ruff`.

    See [ruff docs] for an example (excluding color).

    [ruff docs]: https://docs.astral.sh/ruff/configuration/#full-command-line-interface
    """
    from benchmark import _colorize_install

    _colorize_install.install()
    return _argparse.ArgumentParser(
        prog=f"uv run {entrypoint_name}",
        usage="%(prog)s [OPTIONS]",
        description=description,
        formatter_class=_HelpFormatter,
        suggest_on_error=True,
        color=True,
    )


def parse_options() -> CLIOptions:
    parser = arg_parser(
        "benchmark",
        "Benchmarks server implementations over HTTP POST, with response-size verification",
    )
    parser.add_argument("--port", type=int, default=3000, help="Server port")
    parser.add_argument(
        "--iterations", type=int, default=100, help="Requests per query"
    )
    parser.add_argument("--warmup", type=int, default=5, help="Warmup requests")
    parser.add_argument(
        "--servers",
        nargs="*",
        choices=DEFAULT_SERVERS,
        default=DEFAULT_SERVERS,
        help="One or more servers to test",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Seconds to wait for a server before giving up",
    )
    parser.add_argument(
        "--debug-server", action="store_true", help="Redirect server output to stdout"
    )
    args = parser.parse_args(namespace=CLIOptions())

    if args.iterations < 1:
        parser.error("--iterations must be >= 1")
    if args.warmup < 1:
        parser.error("--warmup must be >= 1")
    return args


def print_options(options: CLIOptions) -> None:
    from rich.table import Table

    from benchmark.common import console

    table = Table(show_header=False)
    table.add_column()
    table.add_column(justify="right")
    table.add_row("iterations", str(options.iterations))
    table.add_row("warmup", str(options.warmup))
    table.add_row("port", str(options.port))
    table.add_row("timeout", str(options.timeout))
    table.add_row("debug_server", str(options.debug_server))
    console.print(table)
