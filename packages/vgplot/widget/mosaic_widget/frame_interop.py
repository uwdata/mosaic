from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final, TypeAlias

import narwhals as nw
from narwhals import Implementation as Impl
from narwhals.dependencies import is_into_dataframe, is_into_lazyframe

from mosaic_widget._exceptions import PerformanceWarning, warn

if TYPE_CHECKING:
    from narwhals.typing import IntoDataFrame, IntoLazyFrame
    from typing_extensions import TypeIs

    IntoFrame: TypeAlias = IntoDataFrame | IntoLazyFrame


_NON_FRAME_TYPES = (str, bytes, int, float, bool, dict, list, tuple, type(None))

_DUCKDB_NATIVE: Final = frozenset((Impl.DUCKDB, Impl.PANDAS, Impl.POLARS, Impl.PYARROW))


def is_registrable_frame(obj: Any) -> TypeIs[IntoFrame]:
    """Return True if `obj` is a dataframe-like object that DuckDB can register."""
    return not isinstance(obj, _NON_FRAME_TYPES) and (
        is_into_dataframe(obj) or is_into_lazyframe(obj)
    )


def frame_to_duckdb_registrable(frame: IntoFrame) -> object:
    nw_frame = nw.from_native(frame)
    if nw_frame.implementation in _DUCKDB_NATIVE:
        return nw_frame.to_native()
    msg = f"'{type(frame).__module__}.{type(frame).__name__}' to Arrow table for DuckDB registration."
    category, stacklevel = PerformanceWarning, 4
    if isinstance(nw_frame, nw.LazyFrame):
        warn(f"Materializing {msg}", category, stacklevel)
        return nw_frame.collect(Impl.PYARROW)
    warn(f"Converting {msg}", category, stacklevel)
    return nw_frame.to_arrow()
