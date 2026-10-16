from __future__ import annotations

import re

import duckdb
import pytest

from mosaic_widget import MosaicWidget, _QueryParams
from mosaic_widget._exceptions import MosaicWidgetError


@pytest.mark.xfail(
    raises=duckdb.IOException,
    reason="TODO @dangotbanned: Replace with a test that uses a spec-defined file path?",
)
def test_query_error_is_sent_to_frontend() -> None:
    widget = MosaicWidget()

    bad_query: _QueryParams = {
        "type": "exec",
        "sql": "CREATE TABLE t AS SELECT * FROM read_parquet('missing.parquet')",
        "uuid": "1",
    }
    with pytest.raises(
        MosaicWidgetError,
        match=re.compile(r"no files.+missing.parquet", re.IGNORECASE | re.DOTALL),
    ):
        widget._handle_custom_msg(bad_query, [])
