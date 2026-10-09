from __future__ import annotations

import argparse as _argparse
from typing import Any


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
