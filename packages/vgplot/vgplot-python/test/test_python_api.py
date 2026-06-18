# Unit tests for the vgplot Python API, covering behaviors that the
# generated-spec round-trip suite does not exercise directly.
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
VGPLOT_SRC = ROOT / "packages" / "vgplot" / "vgplot-python" / "src"
for p in (VGPLOT_SRC, ROOT):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import vgplot as vg  # noqa: E402
from vgplot.plot import Directive, Mark  # noqa: E402


class TestDynamicFactory:
    """The __getattr__ fallback that builds marks/directives for names that
    have no explicit helper (e.g. waffleY)."""

    def test_positional_data_with_encodings_is_kept(self):
        # Regression: a leading positional arg used to be dropped when the
        # call also had keyword encodings, silently losing the mark's data.
        mark = vg.waffle_y("athletes", x="a", y={"count": ""})
        assert isinstance(mark, Mark)
        d = mark.to_dict()
        assert d["mark"] == "waffleY"
        assert d["data"] == {"from": "athletes"}
        assert d["x"] == "a"

    def test_single_positional_no_encodings_is_directive(self):
        out = vg.some_custom_directive([0, 10])
        assert isinstance(out, Directive)

    def test_no_args_is_a_mark(self):
        assert isinstance(vg.some_custom_mark(), Mark)


class TestDataHelpers:
    def test_json_inline_data(self):
        d = vg.json([{"a": 1}, {"a": 2}])
        assert d.to_dict() == {"type": "json", "data": [{"a": 1}, {"a": 2}]}

    def test_json_file(self):
        assert vg.json(file="x.json").to_dict() == {"type": "json", "file": "x.json"}


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
