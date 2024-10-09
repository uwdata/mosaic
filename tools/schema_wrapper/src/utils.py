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


def get_valid_identifier(
    prop: str,
    replacement_character: str = "",
    allow_unicode: bool = False,
    url_decode: bool = True,
) -> str:
    """
    Given a string property, generate a valid Python identifier.

    Parameters
    ----------
    prop: string
        Name of property to decode.
    replacement_character: string, default ''
        The character to replace invalid characters with.
    allow_unicode: boolean, default False
        If True, then allow Python 3-style unicode identifiers.
    url_decode: boolean, default True
        If True, decode URL characters in identifier names.

    Examples
    --------
    >>> get_valid_identifier("my-var")
    'myvar'

    >>> get_valid_identifier("if")
    'if_'

    >>> get_valid_identifier("$schema", "_")
    '_schema'

    >>> get_valid_identifier("$*#$")
    '_'

    >>> get_valid_identifier("Name%3Cstring%3E")
    'Namestring'
    """
    # Decode URL characters.
    if url_decode:
        prop = urllib.parse.unquote(prop)

    # Deal with []
    prop = prop.replace("[]", "Array")

    # First substitute-out all non-valid characters.
    flags = re.UNICODE if allow_unicode else re.ASCII
    valid = re.sub(r"\W", replacement_character, prop, flags=flags)

    # If nothing is left, use just an underscore
    if not valid:
        valid = "_"

    # first character must be a non-digit. Prefix with an underscore
    # if needed
    if re.match(r"^[\d\W]", valid):
        valid = "_" + valid

    # if the result is a reserved keyword, then add an underscore at the end
    if keyword.iskeyword(valid):
        valid += "_"
    return valid

def get_key_by_value(dictionary, target_value):
    for key, value in dictionary.items():
        if value == target_value:
            return key

def get_dependencies(data) -> List[str]:
    dependencies = []

    if isinstance(data, dict):
        if "$ref" in data:
            refVal = data["$ref"]
            dependencies.append(refVal.split('/')[-1])
        
        for key, value in data.items():
            if key != "anyOf":
                dependencies = dependencies + get_dependencies(value)
    elif isinstance(data, list):
        for item in data:
            dependencies = dependencies + get_dependencies(item)

    return dependencies
