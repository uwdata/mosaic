import argparse
from typing import Final
from urllib import request
from pathlib import Path

sys.path.insert(0, str(Path.cwd()))
from reference.altair_schema_api import CodeSnippet, SchemaInfo, codegen
from reference.altair_schema_api.utils import (
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

SCHEMA_VERSION: Final = "v0.10.0"

SCHEMA_URL_TEMPLATE: Final = "https://github.com/uwdata/mosaic/blob/main/docs/public/schema/{version}.json"

def schema_url(version: str = SCHEMA_VERSION) -> str:
    return SCHEMA_URL_TEMPLATE.format(version=version)

def download_schemafile(
    version: str, schemapath: Path, skip_download: bool = False
) -> Path:
    url = schema_url(version=version)
    schemadir = Path(schemapath)
    schemadir.mkdir(parents=True, exist_ok=True)
    fp = schemadir / "mosaic-schema.json"
    if not skip_download:
        request.urlretrieve(url, fp)
    elif not fp.exists():
        msg = f"Cannot skip download: {fp!s} does not exist"
        raise ValueError(msg)
    return fp

def mosaic_main(skip_download: bool = False) -> None:
    version = SCHEMA_VERSION
    vn = '.'.join(version.split(".")[:1])
    fp = (Path(__file__).parent / ".." / template_schemas / vn).resolve()
    schemapath = fp / "schema"
    schemafile = download_schemafile(
        version=version,
        schemapath=schemapath,
        skip_download=skip_download,
    )
    
def recursive_dict_update(schema: dict, root: dict, def_dict: dict) -> None:
    if "$ref" in schema:
        next_schema = resolve_references(schema, root)
        if "properties" in next_schema:
            definition = schema["$ref"]
            properties = next_schema["properties"]
            for k in def_dict:
                if k in properties:
                    def_dict[k] = definition
        else:
            recursive_dict_update(next_schema, root, def_dict)
    elif "anyOf" in schema:
        for sub_schema in schema["anyOf"]:
            recursive_dict_update(sub_schema, root, def_dict)


def get_field_datum_value_defs(propschema: SchemaInfo, root: dict) -> dict[str, str]:
    def_dict: dict[str, str | None] = dict.fromkeys(("field", "datum", "value"))
    schema = propschema.schema
    if propschema.is_reference() and "properties" in schema:
        if "field" in schema["properties"]:
            def_dict["field"] = propschema.ref
        else:
            msg = "Unexpected schema structure"
            raise ValueError(msg)
    else:
        recursive_dict_update(schema, root, def_dict)

    return {i: j for i, j in def_dict.items() if j}
    
def main() -> None:
    parser = argparse.ArgumentParser(
        prog="our_schema_generator", description="Generate the JSON schema for mosaic apps"
    )   
    parser.add_argument(
        "--skip-download", action="store_true", help="skip downloading schema files"
    )   
    args = parser.parse_args()
    copy_schemapi_util()
    mosaic_main(args.skip_download)

    # The modules below are imported after the generation of the new schema files
    # as these modules import Altair. This allows them to use the new changes
    from tools import generate_api_docs, update_init_file

    generate_api_docs.write_api_file()
    update_init_file.update__all__variable()
 
 
 if __name__ == "__main__":
     main()
