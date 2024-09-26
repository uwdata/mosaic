
from __future__ import annotations

import argparse
import copy
import json
import re
import sys
import textwrap
from dataclasses import dataclass
from itertools import chain
from pathlib import Path
from typing import Final, Iterable, Iterator, Literal
from urllib import request

import vl_convert as vlc

from tools.schemapi import CodeSnippet, SchemaInfo, codegen
from tools.schemapi.utils import (
    TypeAliasTracer,
    get_valid_identifier,
    indent_docstring,
    resolve_references,
    rst_parse,
    rst_syntax_for_class,
    ruff_format_py,
    ruff_write_lint_format_str,
    spell_literal,
)

def copy_schemapi_util() -> None:
    """Copy the schemapi utility into mosaic/utils/ and its test file to tests/utils/."""
    source_fp = Path(__file__).parent / "altar_schemapi" / "schemapi.py"
    destination_fp = Path(__file__).parent / ".." / "mosaic" / "utils" / "schemapi.py"

    print(f"Copying\n {source_fp!s}\n  -> {destination_fp!s}")
    with source_fp.open(encoding="utf8") as source, destination_fp.open(
        "w", encoding="utf8"
    ) as dest:
        dest.write(HEADER)
        dest.writelines(source.readlines())
    if sys.platform == "win32":
        ruff_format_py(destination_fp)

def mosaic_main(skip_download: bool = False) -> None:
  #The main function that orchestrates the schema generation process, handling the loading of schemas and the creation of wrapper files.

  #first, download schmea
  #generate schema wrappers 
  #generate channel wrappers
  #generate mark mixin
  #generate channel mixin

#recursive_dict_update:recursively updates a dictionary schema with new definitions, ensuring that references are resolved.
#get_field_datum_value_defs:retrieves definitions for fields, datum, and values from a given property schema.

      
def main() -> None:
    parser = argparse.ArgumentParser(
        prog="generate_mosaic_schema_wrapper.py", description="Generate the Mosaic package."
    )
    parser.add_argument(
        "--skip-download", action="store_true", help="skip downloading schema files"
    )
   
    args = parser.parse_args()
    copy_schemapi_util()
    vegalite_main(args.skip_download)

    # The modules below are imported after the generation of the new schema files
    # as these modules import Altair. This allows them to use the new changes
    from tools import generate_api_docs, update_init_file

    generate_api_docs.write_api_file()
    update_init_file.update__all__variable()


if __name__ == "__main__":
    main()
