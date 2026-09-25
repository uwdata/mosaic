# Unit tests for the vgplot Python API, covering behaviors that the
# generated-spec round-trip suite does not exercise directly.
from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
import vgplot as vg
from vgplot.plot import Mark


class TestGeneratedMarks:
    """Marks are generated from the schema; there is no dynamic fallback, so
    unknown names fail loudly rather than being silently fabricated."""

    def test_positional_data_with_encodings_is_kept(self) -> None:
        # A leading positional arg is the data source even when the call also
        # has keyword encodings.
        mark = vg.waffle_y("athletes", x="a", y={"count": ""})
        assert isinstance(mark, Mark)
        d = mark.to_dict()
        assert d["mark"] == "waffleY"
        assert d["data"] == {"from": "athletes"}
        assert d["x"] == "a"

    def test_explicit_none_channel_is_preserved(self) -> None:
        # Passing a channel explicitly as None keeps it in the output (distinct
        # from not passing it at all).
        assert vg.line_y("t", x="a", z=None).to_dict()["z"] is None
        assert "z" not in vg.line_y("t", x="a").to_dict()

    def test_unknown_name_raises(self) -> None:
        # No __getattr__ fallback: a missing or mis-typed API name is an error.
        with pytest.raises(AttributeError):
            _ = vg.some_custom_mark  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]
        with pytest.raises(AttributeError):
            _ = vg.definitely_not_a_real_directive  # pyright: ignore[reportAttributeAccessIssue] # ty: ignore[unresolved-attribute]


class TestLayout:
    def test_zconcat_keeps_children_in_order(self) -> None:
        a = vg.plot(vg.dot("t", x="a"))
        b = vg.plot(vg.dot("t", x="b"))
        d = vg.zconcat(a, b).to_dict()
        assert list(d) == ["zconcat"]
        assert [c["plot"][0]["x"] for c in d["zconcat"]] == ["a", "b"]

    def test_zconcat_alignment_is_part_of_the_layout(self) -> None:
        plots = [vg.plot(vg.dot("t", x="a")), vg.plot(vg.dot("t", x="b"))]
        d = vg.zconcat(*plots, halign=0.5, valign=1).to_dict()
        assert (d["halign"], d["valign"]) == (0.5, 1)
        assert len(d["zconcat"]) == 2

    def test_zconcat_leaves_out_alignment_that_is_not_given(self) -> None:
        plots = [vg.plot(vg.dot("t", x="a"))]
        assert set(vg.zconcat(*plots).to_dict()) == {"zconcat"}
        assert set(vg.zconcat(*plots, valign=0).to_dict()) == {"zconcat", "valign"}

    def test_zconcat_alignment_is_not_confused_with_spec_options(self) -> None:
        # other keyword arguments still go to the enclosing spec, as for hconcat
        z = vg.zconcat(
            vg.plot(vg.dot("t", x="a")), halign=1, config={"extensions": "x"}
        )
        d = z.to_dict()
        assert d["halign"] == 1
        assert d["config"] == {"extensions": "x"}

    def test_zconcat_nests_in_the_other_layouts(self) -> None:
        z = vg.zconcat(vg.plot(vg.dot("t", x="a")), vg.hspace(4))
        for layout, key in [(vg.vconcat, "vconcat"), (vg.hconcat, "hconcat")]:
            d = layout(z).to_dict()
            assert list(d[key][0]) == ["zconcat"]
            assert d[key][0]["zconcat"][1] == {"hspace": 4}

    def test_zconcat_is_recognized_as_a_spec_view(self) -> None:
        # a positional dict with a view key is the view, not the data
        z = vg.zconcat(vg.plot(vg.dot("t", x="a"))).to_dict()
        d = vg.spec(z, data={"t": vg.json([{"a": 1}])}).to_dict()
        assert list(d["zconcat"][0]) == ["plot"]
        assert "t" in d["data"]

    def test_zconcat_is_exported(self) -> None:
        assert "zconcat" in vg.__all__


class TestDataHelpers:
    def test_json_inline_data(self) -> None:
        d = vg.json([{"a": 1}, {"a": 2}])
        assert d.to_dict() == {"type": "json", "data": [{"a": 1}, {"a": 2}]}

    def test_json_file(self) -> None:
        assert vg.json(file="x.json").to_dict() == {"type": "json", "file": "x.json"}


class TestParams:
    def test_date_param(self) -> None:
        from datetime import date

        assert vg.param(date(2013, 5, 13)).param_def() == {"date": "2013-05-13"}

    def test_datetime_param(self) -> None:
        from datetime import datetime

        assert vg.param(datetime(2013, 5, 13, 10, 30)).param_def() == {  # ruff: ignore[call-datetime-without-tzinfo]
            "date": "2013-05-13T10:30:00"
        }


class TestAutoNaming:
    def test_auto_param_name_skips_explicit_name(self) -> None:
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


class TestDataFrames:
    """A DataFrame passed directly to a mark is discovered by variable name,
    referenced as a table, and carried in the spec's data section for the host
    (e.g. the widget) to register."""

    def test_frame_is_referenced_and_named_after_variable(self) -> None:
        pytest.importorskip("pyarrow")
        import pyarrow as pa

        weather = pa.table({"a": [1, 2, 3]})
        view = vg.plot(vg.dot(weather, x="a"))
        d = view.to_dict()

        assert d["plot"][0]["data"] == {"from": "weather"}
        assert d["data"]["weather"] is weather

    def test_frame_and_datadef_share_the_data_section(self) -> None:
        pytest.importorskip("pyarrow")
        import pyarrow as pa

        weather = pa.table({"a": [1]})
        athletes = vg.csv("athletes.csv")
        view = vg.plot(vg.dot(weather, x="a"), vg.dot(athletes, x="a"))
        d = view.to_dict()

        assert d["plot"][0]["data"] == {"from": "weather"}
        assert d["plot"][1]["data"] == {"from": "athletes"}
        assert d["data"]["weather"] is weather
        assert d["data"]["athletes"] == {"type": "csv", "file": "athletes.csv"}


if TYPE_CHECKING:

    def typing_dunder_all() -> None:
        # Ok
        _ = vg.arrow
        _ = vg.errorbar_x
        _ = vg.mark

        # TODO @dangotbanned: Get pyright to error on these
        # Error (`_generated` modules)
        _ = vg.attributes  # ty: ignore[unresolved-attribute]
        _ = vg.marks  # ty: ignore[unresolved-attribute]
