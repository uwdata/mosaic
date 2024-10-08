"""Utilities for working with schemas."""

from __future__ import annotations

import keyword
import re
import subprocess
import textwrap
import urllib
from html import unescape
from itertools import chain
from operator import itemgetter
from typing import (
    TYPE_CHECKING,
    Any,
    Final,
    Iterable,
    Iterator,
    Literal,
    Sequence,
    overload,
)

if TYPE_CHECKING:
    from pathlib import Path
    from typing_extensions import LiteralString

    from mistune import BlockState

EXCLUDE_KEYS: Final = ("definitions", "title", "description", "$schema", "id")

jsonschema_to_python_types = {
    "string": "str",
    "number": "float",
    "integer": "int",
    "object": "Map",
    "boolean": "bool",
    "array": "list",
    "null": "None",
}