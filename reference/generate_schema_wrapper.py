import json
from typing import Any, Dict

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

    # Generate class definition
    class_def = f"class {class_name}:\n"
    class_def += f"    def __init__(self"

    # Generate __init__ method parameters
    for prop, prop_schema in properties.items():
        default = 'None' if prop not in required else ''
        class_def += f", {prop}: {get_type_hint(prop_schema)} = {default}"

    class_def += "):\n"

    # Generate attribute assignments in __init__
    for prop in properties:
        class_def += f"        self.{prop} = {prop}\n"

    return class_def

def get_type_hint(prop_schema: Dict[str, Any]) -> str:
    # Determine the appropriate type hint based on the property schema
    if 'type' in prop_schema:
        if prop_schema['type'] == 'string':
            return 'str'
        elif prop_schema['type'] == 'boolean':
            return 'bool'
        elif prop_schema['type'] == 'object':
            return 'Dict[str, Any]'
    elif '$ref' in prop_schema:
        return prop_schema['$ref'].split('/')[-1]
    return 'Any'

if __name__ == "__main__":
    schema_file = "reference/testingSchema.json"
    generated_code = generate_schema_wrapper(schema_file)
    print(generated_code)