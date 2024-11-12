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
import sys
import narwhals.stable.v1 as nw
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

def to_dict_ours(cur_object):
    if isinstance(cur_object, dict):
        return {revert_validation(k): to_dict_ours(v) for k, v in cur_object.items() if v is not None}
    elif isinstance(cur_object, list):
        return [to_dict_ours(i) for i in cur_object if i is not None]
    elif hasattr(cur_object, '__dict__'):
        obj_asdict = cur_object.__dict__
        if len(obj_asdict.keys()) == 1:
            return to_dict_ours(list(obj_asdict.values())[0])
        else:
            return {revert_validation(k): to_dict_ours(v) for k, v in obj_asdict.items() if v is not None}
    elif isinstance(cur_object, (str, int, float, bool)):
        return cur_object
    elif cur_object != None:
        return str(cur_object)





### to_dict and all its dependencies are as follows:

def _from_array_like(obj: Iterable[Any], /) -> list[Any]:
    try:
        ser = nw.from_native(obj, strict=True, series_only=True)
        return ser.to_list()
    except TypeError:
        return list(obj)

class UndefinedType:
    """A singleton object for marking undefined parameters."""

    __instance = None

    def __new__(cls, *args, **kwargs) -> Self:
        if not isinstance(cls.__instance, cls):
            cls.__instance = object.__new__(cls, *args, **kwargs)
        return cls.__instance

    def __repr__(self) -> str:
        return "Undefined"


Undefined = UndefinedType()

def _is_iterable(
    obj: Any, *, exclude: type | tuple[type, ...] = (str, bytes)
) -> TypeIs[Iterable[Any]]:
    return not isinstance(obj, exclude) and isinstance(obj, Iterable)

def _get_optional_modules(**modules: str) -> dict[str, _OptionalModule]:
    """
    Returns packages only if they have already been imported - otherwise they return `None`.

    This is useful for `isinstance` checks.

    For example, if `pandas` has not been imported, then an object is
    definitely not a `pandas.Timestamp`.

    Parameters
    ----------
    **modules
        Keyword-only binding from `{alias: module_name}`.

    Examples
    --------
    >>> import pandas as pd  # doctest: +SKIP
    >>> import polars as pl  # doctest: +SKIP
    >>> from altair.utils.schemapi import _get_optional_modules  # doctest: +SKIP
    >>>
    >>> _get_optional_modules(pd="pandas", pl="polars", ibis="ibis")  # doctest: +SKIP
    {
        "pd": <module 'pandas' from '...'>,
        "pl": <module 'polars' from '...'>,
        "ibis": None,
    }

    If the user later imports ``ibis``, it would appear in subsequent calls.

    >>> import ibis  # doctest: +SKIP
    >>>
    >>> _get_optional_modules(ibis="ibis")  # doctest: +SKIP
    {
        "ibis": <module 'ibis' from '...'>,
    }
    """
    return {k: sys.modules.get(v) for k, v in modules.items()}

def _replace_parsed_shorthand(
    parsed_shorthand: dict[str, Any], kwds: dict[str, Any]
) -> dict[str, Any]:
    """
    `parsed_shorthand` is added by `FieldChannelMixin`.

    It's used below to replace shorthand with its long form equivalent
    `parsed_shorthand` is removed from `context` if it exists so that it is
    not passed to child `to_dict` function calls.
    """
    # Prevent that pandas categorical data is automatically sorted
    # when a non-ordinal data type is specifed manually
    # or if the encoding channel does not support sorting
    if "sort" in parsed_shorthand and (
        "sort" not in kwds or kwds["type"] not in {"ordinal", Undefined}
    ):
        parsed_shorthand.pop("sort")

    kwds.update(
        (k, v)
        for k, v in parsed_shorthand.items()
        if kwds.get(k, Undefined) is Undefined
    )
    return kwds

def _todict(obj: Any, context: dict[str, Any] | None = None, np_opt: Any = None, pd_opt: Any = None) -> Any:  # noqa: C901
    """Convert an object to a dict representation."""
    if np_opt is not None:
        np = np_opt
        if isinstance(obj, np.ndarray):
            return [_todict(v, context, np_opt, pd_opt) for v in obj]
        elif isinstance(obj, np.number):
            return float(obj)
        elif isinstance(obj, np.datetime64):
            result = str(obj)
            if "T" not in result:
                # See https://github.com/vega/altair/issues/1027 for why this is necessary.
                result += "T00:00:00"
            return result
    elif isinstance(obj, (list, tuple)):
        return [_todict(v, context, np_opt, pd_opt) for v in obj]
    elif isinstance(obj, dict):
        return {
            k: _todict(v, context, np_opt, pd_opt)
            for k, v in obj.items()
            if v is not Undefined
        }
    elif (
        hasattr(obj, "to_dict")
        and (module_name := obj.__module__)
        and module_name.startswith("altair")
    ):
        return obj.to_dict()
    elif pd_opt is not None and isinstance(obj, pd_opt.Timestamp):
        return pd_opt.Timestamp(obj).isoformat()
    elif _is_iterable(obj, exclude=(str, bytes)):
        return _todict(_from_array_like(obj), context, np_opt, pd_opt)
    else:
        return obj

def to_dict(
    self,
    validate: bool = True,
    *,
    ignore: list[str] | None = None,
    context: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Return a dictionary representation of the object.

    Parameters
    ----------
    validate : bool, optional
        If True (default), then validate the result against the schema.
    ignore : list[str], optional
        A list of keys to ignore.
    context : dict[str, Any], optional
        A context dictionary.

    Raises
    ------
    SchemaValidationError :
        If ``validate`` and the result does not conform to the schema.

    Notes
    -----
    - ``ignore``, ``context`` are usually not needed to be specified as a user.
    - *Technical*: ``ignore`` will **not** be passed to child :meth:`.to_dict()`.
    """
    context = context or {}
    ignore = ignore or []
    opts = _get_optional_modules(np_opt="numpy", pd_opt="pandas")

    if self._args and not self._kwds:
        kwds = self._args[0]
    elif not self._args:
        kwds = self._kwds.copy()
        exclude = {*ignore, "shorthand"}
        if parsed := context.pop("parsed_shorthand", None):
            kwds = _replace_parsed_shorthand(parsed, kwds)
        kwds = {k: v for k, v in kwds.items() if k not in exclude}
        if (mark := kwds.get("mark")) and isinstance(mark, str):
            kwds["mark"] = {"type": mark}
    else:
        msg = f"{type(self)} instance has both a value and properties : cannot serialize to dict"
        raise ValueError(msg)
    result = _todict(kwds, context=context, **opts)
    if validate:
        # NOTE: Don't raise `from err`, see `SchemaValidationError` doc
        try:
            self.validate(result)
        except jsonschema.ValidationError as err:
            raise SchemaValidationError(self, err) from None
    return result

