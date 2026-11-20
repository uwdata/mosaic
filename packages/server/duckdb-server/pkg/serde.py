from __future__ import annotations

import functools
from typing import TYPE_CHECKING, Final, TypeVar

import msgspec

if TYPE_CHECKING:
    from typing_extensions import Buffer, TypeForm


T = TypeVar("T")


serialize_json: Final = msgspec.json.Encoder().encode
"""Serialize an object as JSON."""


def deserialize_json(buf: Buffer | str, tp: TypeForm[T], /) -> T:
    """Deserialize an object from JSON into `T`."""
    return _decoder_json(tp).decode(buf)


@functools.cache
def _decoder_json(tp: TypeForm[T], /) -> msgspec.json.Decoder[T]:
    return msgspec.json.Decoder(tp)
