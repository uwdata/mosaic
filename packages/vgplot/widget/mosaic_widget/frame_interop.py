from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, Final, TypeAlias

import narwhals as nw
from narwhals import Implementation as impl
from narwhals.dependencies import is_into_dataframe, is_into_lazyframe

if TYPE_CHECKING:
    from narwhals.typing import IntoDataFrame, IntoLazyFrame
    from typing_extensions import TypeIs

    IntoFrame: TypeAlias = IntoDataFrame | IntoLazyFrame

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


_NON_FRAME_TYPES = (str, bytes, int, float, bool, dict, list, tuple, type(None))

_DUCKDB_NATIVE: Final = frozenset((impl.DUCKDB, impl.PANDAS, impl.POLARS, impl.PYARROW))


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
    # If frame is not natively registrable to DuckDB, we convert it to an Arrow table via Narwhals.
    # Based on the backend-specific implementation, this may or may not be zero-copy.
    logger.warning(
        f"Converting {type(frame)} to Arrow table for DuckDB registration. This may not be a zero-copy operation."
    )

    # Some backends like Ibis, PySpark, etc. have lazy-only Narwhals support, so we must materialize them
    if isinstance(nw_frame, nw.LazyFrame):
        logger.warning("Materializing lazy frame")
        return nw_frame.collect(impl.PYARROW)
    return nw_frame.to_arrow()
