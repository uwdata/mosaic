from typing import Any

# Permissive value aliases. Channels/attributes accept column names, constants,
# $param references, and SQL expressions; kept broad to avoid false type errors.
ChannelValue = Any
AttrValue = Any
MarkData = Any
TransformArg = Any


class _Unset:
    """Sentinel for mark channels that were not passed (distinct from None)."""

    def __repr__(self) -> str:
        return "UNSET"


UNSET: Any = _Unset()
