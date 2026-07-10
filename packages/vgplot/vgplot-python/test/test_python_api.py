# Unit tests for the vgplot Python API, covering behaviors that the
# generated-spec round-trip suite does not exercise directly.
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[4]
VGPLOT_PKG = ROOT / "packages" / "vgplot" / "vgplot-python"
for p in (VGPLOT_PKG, ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import vgplot as vg  # noqa: E402
from vgplot.plot import Mark  # noqa: E402


class TestGeneratedMarks:
    """Marks are generated from the schema; there is no dynamic fallback, so
    unknown names fail loudly rather than being silently fabricated."""

    def test_positional_data_with_encodings_is_kept(self):
        # A leading positional arg is the data source even when the call also
        # has keyword encodings.
        mark = vg.waffle_y("athletes", x="a", y={"count": ""})
        assert isinstance(mark, Mark)
        d = mark.to_dict()
        assert d["mark"] == "waffleY"
        assert d["data"] == {"from": "athletes"}
        assert d["x"] == "a"

    def test_explicit_none_channel_is_preserved(self):
        # Passing a channel explicitly as None keeps it in the output (distinct
        # from not passing it at all).
        assert vg.line_y("t", x="a", z=None).to_dict()["z"] is None
        assert "z" not in vg.line_y("t", x="a").to_dict()

    def test_unknown_name_raises(self):
        # No __getattr__ fallback: a missing or mis-typed API name is an error.
        with pytest.raises(AttributeError):
            vg.some_custom_mark  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]
        with pytest.raises(AttributeError):
            vg.definitely_not_a_real_directive  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]


class TestDataHelpers:
    def test_json_inline_data(self):
        d = vg.json([{"a": 1}, {"a": 2}])
        assert d.to_dict() == {"type": "json", "data": [{"a": 1}, {"a": 2}]}

    def test_json_file(self):
        assert vg.json(file="x.json").to_dict() == {"type": "json", "file": "x.json"}


class TestParams:
    def test_date_param(self):
        from datetime import date

        assert vg.param(date(2013, 5, 13)).param_def() == {"date": "2013-05-13"}

    def test_datetime_param(self):
        from datetime import datetime

        assert vg.param(datetime(2013, 5, 13, 10, 30)).param_def() == {
            "date": "2013-05-13T10:30:00"
        }


class TestAutoNaming:
    def test_auto_param_name_skips_explicit_name(self):
        from vgplot.spec import Spec

        named = vg.param(1)
        unnamed = vg.param(2)
        view = vg.plot(vg.dot("t", x=unnamed))
        # The explicit param already occupies "_param0"; the in-view param must
        # not collide with it.
        d = Spec(params={"_param0": named}, view=view).to_dict()
        assert d["params"]["_param0"] == 1
        assert d["params"]["_param1"] == 2
        assert d["plot"][0]["x"] == "$_param1"
