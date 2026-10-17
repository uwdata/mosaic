from __future__ import annotations

# pyright: reportPrivateUsage=none
import argparse as _argparse
import sys
from typing import TYPE_CHECKING, Any, TypeVar
from typing import Literal as L

import msgspec

from benchmark.common import DEFAULT_SERVERS, Port, Seconds, ServerName

if TYPE_CHECKING:
    from argparse import Action, _SubParsersAction
    from collections.abc import Generator, Sequence

    _ArgumentParserT = TypeVar("_ArgumentParserT", bound=_argparse.ArgumentParser)


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
    def _get_default_metavar_for_optional(self, action: Action) -> str:
        if action_type := action.type:
            if isinstance(action_type, type):
                return action_type.__name__
            if isinstance(action_type, str):
                return action_type
        return ""

    get_default_metavar_for_positional = _get_default_metavar_for_optional

    def _iter_indented_subactions(
        self, action: Action | _SubParsersAction[Any]
    ) -> Generator[Action]:
        # NOTE: Removes the extra indent level for subcommands
        # https://github.com/python/cpython/blob/5a22a62b96a68c2dd31784c5e3427ad7b365388a/Lib/argparse.py#L766-L774
        if get_subactions := getattr(action, "_get_subactions", None):
            yield from get_subactions()

    def _format_action(self, action: Action) -> str:
        result = super()._format_action(action)
        if not isinstance(action, _argparse._SubParsersAction):
            return result
        # NOTE: For subcommands, the only behavior is to display this:
        # > Commands:
        # >   {com1,com2}
        # >     com1      Help 1
        # >     com2      Help 2
        #
        # That looks bad, this is better:
        # > Commands:
        # >   com1        Help 1
        #
        # There's nothing to hook into besides string manipulation, so this drops the first entry of `parts` after
        # it is joined
        # https://github.com/python/cpython/blob/5a22a62b96a68c2dd31784c5e3427ad7b365388a/Lib/argparse.py#L579-L632
        return result[result.index("\n") + 1 :]


def arg_parser(entrypoint_name: str, /, description: str) -> _argparse.ArgumentParser:
    """Create an `ArgumentParser` inspired by `cargo`, `uv`, `ruff`.

    See [ruff docs] for an example (excluding color).

    [ruff docs]: https://docs.astral.sh/ruff/configuration/#full-command-line-interface
    """

    if sys.version_info >= (3, 14):
        from benchmark import _colorize_install

        _colorize_install.install()
        kwds: dict[str, Any] = {"suggest_on_error": True, "color": True}
    else:
        kwds = {}
    return _argparse.ArgumentParser(
        prog=f"uv run {entrypoint_name}",
        usage="%(prog)s [OPTIONS]",
        description=description,
        formatter_class=_HelpFormatter,
        argument_default=_argparse.SUPPRESS,
        **kwds,
    )


def subcommand(
    command_name: str, /, description: str, action: _SubParsersAction[_ArgumentParserT]
) -> _ArgumentParserT:
    if sys.version_info >= (3, 14):
        kwds: dict[str, Any] = {"suggest_on_error": True, "color": True}
    else:
        kwds = {}
    return action.add_parser(
        command_name,
        description=description,
        help=description,
        formatter_class=_HelpFormatter,
        **kwds,
    )


class CLIOptions(msgspec.Struct, kw_only=True):
    scheme: L["http", "https"] = "https"
    # NOTE: localhost is slower on (at least) windows
    host: L["localhost", "127.0.0.1"] = "127.0.0.1"
    port: Port = Port(3000)
    iterations: int = 100
    warmup: int = 5
    timeout: Seconds = Seconds(30)
    servers: Sequence[ServerName] = DEFAULT_SERVERS
    # TODO @dangotbanned: replace this with a dispatch to somewhere else
    command: object = None

    def base_url(self, port: Port | None = None) -> str:
        return f"{self.scheme}://{self.host}:{(port or self.port)}"

    @staticmethod
    def parse() -> CLIOptions:
        parser = arg_parser(
            "benchmark",
            "Benchmarks server implementations over HTTP POST, with response-size verification",
        )
        parser.add_argument(
            "--host",
            choices=("localhost", "127.0.0.1"),
            default="127.0.0.1",
            help="Server host",
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

        subparsers = parser.add_subparsers(title="Commands", dest="command")
        subparsers.default = _argparse.SUPPRESS
        _build_parser = subcommand(
            "build", "Compile or run the build step for each server", subparsers
        )

        args = parser.parse_args(namespace=CLIOptions())

        if args.iterations < 1:
            parser.error("--iterations must be >= 1")
        if args.warmup < 1:
            parser.error("--warmup must be >= 1")
        return args

    def print(self) -> None:
        from rich.table import Table

        from benchmark.common import console

        table = Table(show_header=False)
        table.add_column()
        table.add_column(justify="right")
        table.add_row("iterations", str(self.iterations))
        table.add_row("warmup", str(self.warmup))
        table.add_row("host", self.host)
        table.add_row("port", str(self.port))
        table.add_row("timeout", str(self.timeout))
        console.print(table)
