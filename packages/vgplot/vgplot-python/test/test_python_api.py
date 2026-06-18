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
