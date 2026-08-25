from __future__ import annotations

import warnings


class MosaicWidgetWarning(UserWarning):
    """Any kind of warning issued by `mosaic_widget`."""


class PerformanceWarning(MosaicWidgetWarning):
    """Warning issued for data sources that require conversion/materialization."""


def warn(
    message: str, category: type[Warning] = MosaicWidgetWarning, stacklevel: int = 3
) -> None:
    """Issue a warning.

    Args:
        message: The text of the warning message.
        category: The Warning category subclass.
        stacklevel: How far up the call stack to make this warning appear.
            A value of 3 for example attributes the warning to the caller of the code calling warn().
    """
    warnings.warn(message, category, max(stacklevel, 3))
