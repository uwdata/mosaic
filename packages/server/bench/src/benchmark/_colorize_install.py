"""https://github.com/dangotbanned/mosaic/blob/a35796f644df7d88eca465330396d7149df6a48a/packages/vgplot/spec-python/tools/_colorize_install.py"""

from __future__ import annotations


def install() -> None:
    """Try to override the default `_colorize` theme, to work better with a dark terminal.

    See [python/cpython#133346] for more info.

    [python/cpython#133346]: https://github.com/python/cpython/issues/133346
    """
    import contextlib

    with contextlib.suppress(ImportError):
        # https://github.com/python/typeshed/issues/16361
        from _colorize import ANSIColors, Argparse, Traceback, default_theme, set_theme  # ty: ignore[unresolved-import]  # pyrefly: ignore[missing-import]  # pyright: ignore[reportMissingTypeStubs]

        # NOTE: argparse colors based on `cargo`
        heading = ANSIColors.BOLD_GREEN
        code = ANSIColors.CYAN
        code_bold = ANSIColors.BOLD_CYAN
        set_theme(
            default_theme.copy_with(
                traceback=Traceback(
                    type=ANSIColors.BOLD_RED,
                    # `MAGENTA` default is bad on dark
                    message=ANSIColors.YELLOW,
                    filename=ANSIColors.BOLD_WHITE,
                    line_no=ANSIColors.BOLD_WHITE,
                    frame=ANSIColors.INTENSE_WHITE,
                ),
                argparse=Argparse(
                    usage=heading,
                    heading=heading,
                    short_option=code_bold,
                    long_option=code_bold,
                    prog=code_bold,
                    prog_extra=code,
                    label=code,
                ),
            )
        )
