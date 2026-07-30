from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any, TypeAlias

import narwhals as nw
from narwhals.dependencies import is_into_dataframe, is_into_lazyframe

if TYPE_CHECKING:
    from narwhals.typing import IntoDataFrame, IntoLazyFrame
    from typing_extensions import TypeIs

    IntoFrame: TypeAlias = IntoDataFrame | IntoLazyFrame

logger = logging.getLogger(__name__)
logger.addHandler(logging.NullHandler())


_NON_FRAME_TYPES = (str, bytes, int, float, bool, dict, list, tuple, type(None))


def is_registrable_frame(obj: Any) -> TypeIs[IntoFrame]:
    """Return True if `obj` is a dataframe-like object that DuckDB can register."""
    return not isinstance(obj, _NON_FRAME_TYPES) and (
        is_into_dataframe(obj) or is_into_lazyframe(obj)
    )


# TODO @dangotbanned: Replace with Narwhals
def _is_frame_native_to_duckdb(frame: IntoFrame) -> bool:
    """Check if a frame is natively supported by DuckDB to be registered as a virtual table with zero-copy guarantees."""

    # "<class '{module_path}'>" -> "{module_path}" via slicing
    module_path = str(type(frame))[8:-2]
    frame_backend = module_path.split(".")[0]
    backends_with_native_virtual_table_support = {"pandas", "polars", "pyarrow"}
    return frame_backend in backends_with_native_virtual_table_support


# TODO @dangotbanned: Avoid materializing `DuckDBPyRelation`
def frame_to_duckdb_registrable(frame: IntoFrame) -> object:
    """Converts a native dataframe(-like) object to a DuckDB-registrable object.

    If the passed `frame` is one of the backends supported by DuckDB to be registered as a virtual table with zero-copy guarantees,
    we return the `frame` itself. Otherwise, we convert it to a Narwhals frame and then to an Arrow table. Based on the backend-specific implementation,
    this may or may not be a zero-copy operation.

    If the passed `frame` is a lazy frame, it is materialized.
    """
    if _is_frame_native_to_duckdb(frame):
        return frame

    # If frame is not natively registrable to DuckDB, we convert it to an Arrow table via Narwhals.
    # Based on the backend-specific implementation, this may or may not be zero-copy.
    nw_frame = nw.from_native(frame)
    logger.warning(
        f"Converting {type(frame)} to Arrow table for DuckDB registration. This may not be a zero-copy operation."
    )

    # Some backends like Ibis, PySpark, etc. have lazy-only Narwhals support, so we must materialize them
    if isinstance(nw_frame, nw.LazyFrame):
        logger.warning("Materializing lazy frame")
        nw_frame = nw_frame.collect()

    return nw_frame.to_arrow()
