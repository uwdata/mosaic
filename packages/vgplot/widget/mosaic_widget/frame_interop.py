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
    """Converts a native dataframe(-like) object to a DuckDB-registrable object.

    If the passed `frame` is one of the backends supported by DuckDB to be registered as a virtual table with zero-copy guarantees,
    we return the `frame` itself. Otherwise, we convert it to a Narwhals frame and then to an Arrow table. Based on the backend-specific implementation,
    this may or may not be a zero-copy operation.

    If the passed `frame` is a lazy frame, it is materialized.
    """
    nw_frame = nw.from_native(frame)
    if nw_frame.implementation in _DUCKDB_NATIVE:
        return nw_frame.to_native()
    tp = type(frame)
    msg = f"Converting '{tp.__module__}.{tp.__name__}' to Arrow table for DuckDB registration. This may not be a zero-copy operation."
    warn(msg, PerformanceWarning)

    if isinstance(nw_frame, nw.LazyFrame):
        warn("Materializing lazy frame", PerformanceWarning)
        return nw_frame.collect(Impl.PYARROW)
    return nw_frame.to_arrow()
