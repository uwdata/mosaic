"""
Run: generate-schema-wrapper path/to/your/schema.json
e.g. generate-schema-wrapper ../reference/testingSchema.json
"""

import json
from typing import Any, Dict
from . import utils

def generate_schema_wrapper(schema_file: str) -> str:
    with open(schema_file, 'r') as f:
        schema = json.load(f)

    definitions = schema.get('definitions', {})

    # Generate classes for each definition
    classes = []
    for class_name, class_schema in definitions.items():
        classes.append(generate_class(class_name, class_schema))

    #Combine all generated classes into a single string
    return "\n\n".join(classes)

def generate_class(class_name: str, class_schema: Dict[str, Any]) -> str:
    # Extract properties and required fields
    properties = class_schema.get('properties', {})
    required = class_schema.get('required', [])
    description = class_schema.get('description', '')

    # Generate class definition
    class_def = f"class {class_name}:\n"
    class_def += f'    """{description}"""\n\n'
    class_def += f"    def __init__(self"


    # Generate __init__ method parameters
    for prop, prop_schema in properties.items():
        default = 'None' if prop not in required else ''
        class_def += f", {prop}: {get_type_hint(prop_schema)} = {default}"

    class_def += "):\n"

    # Generate attribute assignments in __init__
    for prop, prop_schema in properties.items():
        prop_description = prop_schema.get('description', '')
        class_def += f'        """{prop_description}"""\n'
        class_def += f"        self.{prop} = {prop}\n\n"

    return class_def

def get_type_hint(prop_schema: Dict[str, Any]) -> str:
    # Determine the appropriate type hint based on the property schema
    # use utils.jsonschema_to_python_types
    if 'type' in prop_schema:
        propType = prop_schema['type']
        if (propType in utils.jsonschema_to_python_types):
            return utils.jsonschema_to_python_types[propType]
    
        elif prop_schema['type'] == 'object':
            return 'Dict[str, Any]'
    elif '$ref' in prop_schema:
        return prop_schema['$ref'].split('/')[-1]
    return 'Any'

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Generate schema wrapper classes")
    parser.add_argument("schema_file", help="Path to the JSON schema file")
    args = parser.parse_args()
    
    generated_code = generate_schema_wrapper(args.schema_file)
    print(generated_code)

if __name__ == "__main__":
    main()