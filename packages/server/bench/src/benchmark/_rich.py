"""Tools for working with [Rich](https://github.com/Textualize/rich)."""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING
from typing import Literal as L

from rich import progress as rp

from benchmark.common import console

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

    from rich.style import StyleType

type SpinnerName = L["dots", "dots2", "dots8", "dots10", "simpleDotsScrolling", "flip"]
"""See [spinners.gif] for all 70+ options.

[spinners.gif]: https://raw.githubusercontent.com/textualize/rich/9d8f9a372cc5916fd4781fec207ced7ddac2f08f/imgs/spinners.gif
"""


def track[T](
    iterable: Iterable[T],
    msg_wait: str = "Working",
    msg_done: str = "Finished.",
    *,
    spinner: SpinnerName | str | None = "dots",
    total: float | None = None,
    refresh_per_second: float = 10,
    style: StyleType = "bar.back",
    complete_style: StyleType = "bar.complete",
    finished_style: StyleType = "bar.finished",
    pulse_style: StyleType = "bar.pulse",
    update_period: float = 0.1,
    show_speed: bool = False,
) -> Iterator[T]:
    """Track progress while iterating over `iterable`.

    Adapted from [`rich.progress.track`][1].

    [1]: https://rich.readthedocs.io/en/stable/reference/progress.html#rich.progress.track
    """
    progress = rp.Progress(
        rp.TextColumn("[progress.description]{task.description}"),
        *((rp.SpinnerColumn(spinner),) if spinner else ()),
        rp.BarColumn(
            style=style,
            complete_style=complete_style,
            finished_style=finished_style,
            pulse_style=pulse_style,
        ),
        rp.TaskProgressColumn(show_speed=show_speed),
        console=console,
        transient=True,
        refresh_per_second=refresh_per_second,
    )

    with progress:
        yield from progress.track(
            iterable, total=total, description=msg_wait, update_period=update_period
        )
    console.print(f"[green bold]{msg_done}[/]")


def link(
    path: Path,
    text: str | None = None,
    /,
    relative: Path | None = None,
    *,
    bold: bool = False,
) -> str:
    """Format a link to `path`.

    Args:
        path: Destination file path.
        text: (Optional) override for generated link text.
        relative: A related path to use as an anchor for generated link text.
            By default, uses the current working directory.
        bold: Render the text as bold.
    """
    text = text or (path.relative_to(relative or Path.cwd()).as_posix())
    text = text if not bold else f"[b]{text}[/b]"
    return f"[link={path.as_uri()}]{text}[/]"


def capture(*lines: str) -> str:
    """Get the string that Rich would render after joining `lines`.

    Enables using rich to format text for `argparse`, without needing to handle
    terminal detection manually.
    """
    with console.capture() as capture:
        console.print("\n".join(lines))
    return capture.get()
