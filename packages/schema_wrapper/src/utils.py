"""Utilities for working with schemas."""

from __future__ import annotations

import keyword
import re
import urllib
from typing import (
    TYPE_CHECKING,
    Final
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

def revert_validation(field):
    return field.strip('_')

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

def to_dict(cur_object):
    if isinstance(cur_object, dict):
        return {revert_validation(k): to_dict(v) for k, v in cur_object.items() if v is not None}
    elif isinstance(cur_object, list):
        return [to_dict(i) for i in cur_object if i is not None]
    elif hasattr(cur_object, '__dict__'):
        obj_asdict = cur_object.__dict__
        if len(obj_asdict.keys()) == 1:
            return to_dict(list(obj_asdict.values())[0])
        else:
            return {revert_validation(k): to_dict(v) for k, v in obj_asdict.items() if v is not None}
    elif isinstance(cur_object, (str, int, float, bool)):
        return cur_object
    elif cur_object != None:
        return str(cur_object)
