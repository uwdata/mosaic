import json
from typing import Any, Dict, List, Union, Final, Iterable, Iterator, Literal
import sys
import yaml
import argparse
import copy
import re
import textwrap
from dataclasses import dataclass
from itertools import chain
from pathlib import Path
from urllib import request

sys.path.insert(0, str(Path.cwd()))
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

def generate_class(class_name: str, class_schema: Dict[str, Any]) -> str:

    imports = "from typing import Any, Union\n"

    if 'type' in class_schema and 'properties' not in class_schema:
        return f"class {class_name}:\n    def __init__(self):\n        pass\n"

    if '$ref' in class_schema:
        ref_class_name = class_schema['$ref'].split('/')[-1]
        return f"{imports}\nclass {class_name}:\n    pass  # This is a reference to {ref_class_name}\n"

    if 'anyOf' in class_schema:
            return generate_any_of_class(class_name, class_schema['anyOf'])

    properties = class_schema.get('properties', {})
    required = class_schema.get('required', [])

    class_def = f"{imports}class {class_name}:\n"
    class_def += "    def __init__(self"

    for prop, prop_schema in properties.items():
        type_hint = get_type_hint(prop_schema)
        if prop in required:
            class_def += f", {prop}: {type_hint}"
        else:
            class_def += f", {prop}: {type_hint} = None"

    class_def += "):\n"

    for prop in properties:
        class_def += f"        self.{prop} = {prop}\n"

    return class_def


def generate_any_of_class(class_name: str, any_of_schemas: List[Dict[str, Any]]) -> str:
    types = [get_type_hint(schema) for schema in any_of_schemas]
    type_union = "Union[" + ", ".join(f'"{t}"' for t in types) + "]"  

    class_def = f"class {class_name}:\n"
    class_def += f"    def __init__(self, value: {type_union}):\n"
    class_def += "        self.value = value\n"
    
    return class_def


    
def get_type_hint(prop_schema: Dict[str, Any]) -> str:
        """Get type hint for a property schema."""
        if 'type' in prop_schema:
            if prop_schema['type'] == 'string':
                return 'str'
            elif prop_schema['type'] == 'boolean':
                return 'bool'
            elif prop_schema['type'] == 'object':
                return 'Dict[str, Any]'
        elif 'anyOf' in prop_schema:
            types = [get_type_hint(option) for option in prop_schema['anyOf']]
            return f'Union[{", ".join(types)}]'
        elif '$ref' in prop_schema:
            return prop_schema['$ref'].split('/')[-1] 
        return 'Any'

def load_schema(schema_path: Path) -> dict:
    """Load a JSON schema from the specified path."""
    with schema_path.open(encoding="utf8") as f:
        return json.load(f)

def generate_schema_wrapper(schema_file: Path, output_file: Path) -> str:
    """Generate a schema wrapper for the given schema file."""
    rootschema = load_schema(schema_file)
    
    definitions: Dict[str, str] = {}

    for name, schema in rootschema.get("definitions", {}).items():
        class_code = generate_class(name, schema)
        definitions[name] = class_code

    generated_classes =  "\n\n".join(definitions.values())

    with open(output_file, 'w') as f:
        f.write(generated_classes)

if __name__ == "__main__":
    schema_file = "tools/testingSchema.json" 
    output_file = Path("tools/generated_classes.py")
    generate_schema_wrapper(Path(schema_file), output_file)
