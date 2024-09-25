import argparse
from typing import Final
from urllib import request
from pathlib import Path

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
