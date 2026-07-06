import pytest

from mosaic_widget import MosaicWidget


class SpecWithContext:
    """Stand-in for a vgplot View: to_dict() accepts the caller frame locals."""

    def __init__(self):
        self.received_context = None

    def to_dict(self, _context=None):
        self.received_context = _context
        return {"plot": [], "seen": "context"}


class SpecWithoutContext:
    """Stand-in for a vgplot Spec: to_dict() takes no _context argument."""

    def to_dict(self):
        return {"plot": [], "seen": "plain"}


def test_dict_spec_is_used_as_is():
    spec = {"plot": [{"mark": "dot"}]}
    widget = MosaicWidget(spec)
    assert widget.spec == spec


def test_spec_object_with_context_receives_caller_locals():
    marker = object()  # noqa: F841 -- discoverable in the caller frame
    spec_obj = SpecWithContext()
    widget = MosaicWidget(spec_obj)

    assert widget.spec == {"plot": [], "seen": "context"}
    # The caller frame locals were threaded through to to_dict().
    assert spec_obj.received_context is not None
    assert any(v is marker for v in spec_obj.received_context.values())


def test_spec_object_without_context_falls_back():
    widget = MosaicWidget(SpecWithoutContext())
    assert widget.spec == {"plot": [], "seen": "plain"}


def test_object_without_to_dict_raises():
    with pytest.raises(TypeError, match="to_dict"):
        # An object without to_dict() is intentionally invalid input.
        MosaicWidget(object())  # ty: ignore[invalid-argument-type]
