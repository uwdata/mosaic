"""Tools for working with [Rich](https://github.com/Textualize/rich)."""

from __future__ import annotations

from typing import TYPE_CHECKING
from typing import Literal as L

from rich import progress as rp

from benchmark.common import console

if TYPE_CHECKING:
    from collections.abc import Iterable, Iterator

    from rich.style import StyleType

type SpinnerName = L[
    "dots",
    "dots2",
    "dots3",
    "dots4",
    "dots5",
    "dots6",
    "dots7",
    "dots8",
    "dots9",
    "dots10",
    "dots11",
    "dots12",
    "dots8Bit",
    "line",
    "line2",
    "pipe",
    "simpleDots",
    "simpleDotsScrolling",
    "star",
    "star2",
    "flip",
    "hamburger",
    "growVertical",
    "growHorizontal",
    "balloon",
    "balloon2",
    "noise",
    "bounce",
    "boxBounce",
    "boxBounce2",
    "triangle",
    "arc",
    "circle",
    "squareCorners",
    "circleQuarters",
    "circleHalves",
    "squish",
    "toggle",
    "toggle2",
    "toggle3",
    "toggle4",
    "toggle5",
    "toggle6",
    "toggle7",
    "toggle8",
    "toggle9",
    "toggle10",
    "toggle11",
    "toggle12",
    "toggle13",
    "arrow",
    "arrow2",
    "arrow3",
    "bouncingBar",
    "bouncingBall",
    "smiley",
    "monkey",
    "hearts",
    "clock",
    "earth",
    "material",
    "moon",
    "runner",
    "pong",
    "shark",
    "dqpb",
    "weather",
    "christmas",
    "grenade",
    "point",
    "layer",
    "betaWave",
    "aesthetic",
]


def track[T](
    iterable: Iterable[T],
    msg_wait: str = "Working",
    msg_done: str = "Finished.",
    *,
    spinner: SpinnerName | None = "dots",
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
    console.print(msg_done)
