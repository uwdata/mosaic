from pathlib import Path

import duckdb
import pytest
from pkg.server import create_bundle, load_bundle


@pytest.fixture(scope="session")
def bundle_dir(tmpdir_factory):
    return Path(tmpdir_factory.mktemp("bundle"))


def test_bundle(bundle_dir):
    con = duckdb.connect()

    queries = [
        'CREATE TEMP TABLE IF NOT EXISTS flights AS SELECT * FROM read_parquet("data/flights-200k.parquet")',
        'SELECT count(*) FROM "flights"',
    ]

    create_bundle(con, queries, directory=bundle_dir)

    load_bundle(con, directory=bundle_dir)
