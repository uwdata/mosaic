import json
from typing import Any, Dict, List, Final
import sys
from pathlib import Path
import graphlib
from schema_wrapper.utils import get_valid_identifier, get_dependencies

sys.path.insert(0, str(Path.cwd()))

SCHEMA_VERSION: Final = "v0.10.0"
KNOWN_PRIMITIVES = {"string": "str", "boolean": "bool", "number": "float", "object": "Dict[str, Any]"}
IMPORTS = {"typing": ["List", "Dict", "Any", "Union"], "schema_wrapper.SchemaBase": ["SchemaBase"], "schema_wrapper.utils": ["revert_validation"]}

def generate_import_string(imports: Dict[str, List[str]]) -> str:
    import_string = ""
    for source, cur_imports in imports.items():
        import_string += f"from {source} import {', '.join(cur_imports)}\n"
    import_string += '\n'
    return import_string

def generate_additional_properties_class(class_name: str, class_schema: Dict[str, Any]) -> str:
    # At the moment, this can only handle classes with one $ref additional property
    class_def = f"class {class_name}(SchemaBase):\n    def __init__(self, **kwargs):\n"
    properties_object = class_schema.get('additionalProperties', {})
    correct_type = get_type_hint(properties_object)
    #if correct_type not in KNOWN_PRIMITIVES.values():
        #correct_type = f'"{correct_type}"'
    class_def += """        for key, value in kwargs.items():
            if not isinstance(value, """+ correct_type +"""):
                raise ValueError(f"Value for key '{key}' must be an instance of """+ correct_type.strip('"') +""".")
        self.additional_params = kwargs\n\n"""
    return class_def

def generate_enum_class(class_name: str, class_schema: Dict[str, Any]) -> str:
    enum_options = class_schema.get('enum', [])
    enum_type = get_type_hint(class_schema)
    class_def = f"class {class_name}(SchemaBase):\n    enum_options = {enum_options}\n\n    def __init__(self, value: {enum_type}):\n"
    class_def += """        if value not in self.enum_options:
            raise ValueError(f"Value of enum not in allowed values: {self.enum_options}")
        self.value = value\n"""
    return class_def

def generate_class(class_name: str, class_schema: Dict[str, Any]) -> str:
    class_name = get_valid_identifier(class_name)

    # Check if the schema defines a simple type (like string, number) without properties
    if 'type' in class_schema and 'properties' not in class_schema:
        if 'additionalProperties' in class_schema:
            return generate_additional_properties_class(class_name, class_schema)
        elif 'enum' in class_schema:
            return generate_enum_class(class_name, class_schema)
        else:
            type_hint = get_type_hint(class_schema)
            return f"class {class_name}(SchemaBase):\n    def __init__(self, value: {type_hint}):\n        self.value = value\n"

    # Check for '$ref' and handle it
    if '$ref' in class_schema:
        ref_class_name = get_valid_identifier(class_schema['$ref'].split('/')[-1])
        return f"\nclass {class_name}({ref_class_name}):\n    pass  # This is a reference to '{ref_class_name}'\n"
    if 'anyOf' in class_schema:
            return generate_any_of_class(class_name, class_schema['anyOf'])

    # Extract properties and required fields
    properties = class_schema.get('properties', {})
    required = class_schema.get('required', [])
    additional_properties = class_schema.get('additionalProperties')

    class_def = f"class {class_name}(SchemaBase):\n"
    class_def += "    def __init__(self"

    # Generate __init__ method parameters
    optional_params = []

    # Ensuring all the property names are valid Python identifiers
    valid_properties = {}
    for prop, prop_schema in properties.items():
        valid_prop = get_valid_identifier(prop)
        valid_properties[valid_prop] = prop_schema

    for prop, prop_schema in valid_properties.items():
        if 'anyOf' in prop_schema:
            # Handle anyOf case
            type_hint = f"Union[{', '.join(get_type_hint(item) for item in prop_schema['anyOf'])}]"
        else:
            type_hint = get_type_hint(prop_schema)
        
        if prop in required:
            # Required parameters should not have default values
            class_def += f", {prop}: {type_hint}"
        else:
            # Ensure we add optional parameters last
            optional_params.append((prop, type_hint))

    for prop, type_hint in optional_params:
        class_def += f", {prop}: {type_hint} = None"

    # Handling additionalProperties
    if additional_properties != False and additional_properties != None:
            class_def += ", **kwargs"

    class_def += "):\n"

    # Generate attribute assignments in __init__
    for prop in valid_properties:
        class_def += f"        self.{prop} = {prop}\n"
    
    # Handling additionalProperties
    if additional_properties != False and additional_properties != None:
        correct_type = get_type_hint(additional_properties)
        class_def += """        for key, value in kwargs.items():
            if not isinstance(value, """+ correct_type +"""):
                raise ValueError(f"Value for key '{key}' must be an instance of """+ correct_type.strip('"') +""".")
        self.additional_params = kwargs\n\n"""


    return class_def

def get_type_union(types: List[str]):
    unique_types = list(set(types))
    if len(unique_types) == 1:
        return unique_types[0]

    # Moving the potential "Any" to the end of the list
    if "Any" in unique_types:
        unique_types.remove("Any")
        unique_types.append("Any")
    return f'Union[{", ".join(unique_types)}]'

def generate_any_of_class(class_name: str, any_of_schemas: List[Dict[str, Any]]) -> str:
    types = [get_type_hint(schema) for schema in any_of_schemas]
    type_union = get_type_union(types)
    
    class_def = f"class {class_name}(SchemaBase):\n"
    class_def += f"    def __init__(self, value: {type_union}):\n"
    class_def += "        self.value = value\n"
    
    return class_def

def get_type_hint(type_schema: Dict[str, Any]) -> str:
        """Get type hint for a property schema."""
        if 'items' in type_schema:
            assert type_schema['type'] == 'array'
            
            items_schema = type_schema['items']
            # items_schema contains the types which are stored in the list

            datatype = get_type_hint(items_schema)
            return f"List[{datatype}]"
            
        if 'type' in type_schema:
            if isinstance(type_schema['type'], list):
                types = []
                for t in type_schema['type']:
                    datatype = KNOWN_PRIMITIVES.get(t, "Any")
                    types.append(datatype)
                
                return get_type_union(types)
            else:
                datatype = KNOWN_PRIMITIVES.get(type_schema['type'], "Any")
                return datatype
        elif 'anyOf' in type_schema:
            types = [get_type_hint(option) for option in type_schema['anyOf']]
            return get_type_union(types)
        elif '$ref' in type_schema:
            ref_class_name = get_valid_identifier(type_schema['$ref'].split('/')[-1])
            return f'"{ref_class_name}"'  
        return 'Any'

def load_schema(schema_path: Path) -> dict:
    """Load a JSON schema from the specified path."""
    with schema_path.open(encoding="utf8") as f:
        return json.load(f)

def generate_schema_wrapper(schema_file: Path, output_file: Path) -> str:
    """Generate a schema wrapper for the given schema file."""
    rootschema = load_schema(schema_file)
    
    rootschema_definitions = rootschema.get("definitions", {})
    ts = graphlib.TopologicalSorter()

    for name, schema in rootschema_definitions.items():
        dependencies = get_dependencies(schema)
        if dependencies:
            ts.add(name, *dependencies)
        else:
            ts.add(name)
    
    class_order = list(ts.static_order())

    definitions: Dict[str, str] = {}

    for name in class_order:
        schema = rootschema_definitions.get(name)
        class_code = generate_class(name, schema)
        definitions[name] = class_code

    generated_classes =  "\n\n".join(definitions.values())
    import_string = generate_import_string(IMPORTS)
    generated_classes = import_string + generated_classes


    with open(output_file, 'w') as f:
        f.write(generated_classes)

def main():
    current_file_path = Path(__file__).parent 

    schema_path = current_file_path.parent.parent.parent /  "docs" / "public" / "schema" / f"{SCHEMA_VERSION}.json"
    output_file = current_file_path.parent  / "schema_wrapper" / "generated_classes.py"
    generate_schema_wrapper(schema_path, output_file)

# Main execution
if __name__ == "__main__":
    main()
