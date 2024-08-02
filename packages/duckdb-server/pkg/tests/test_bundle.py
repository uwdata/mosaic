from pathlib import Path

import duckdb
import pytest

from pkg.bundle import create_bundle, load_bundle


@pytest.fixture(scope="session")
def bundle_dir(tmpdir_factory):
    return Path(tmpdir_factory.mktemp("bundle"))


def test_bundle(bundle_dir):
    con = duckdb.connect()

    queries = [
        'CREATE TEMP TABLE IF NOT EXISTS flights AS SELECT * FROM read_parquet("data/flights-200k.parquet")',
        'SELECT count(*) FROM "flights"',
    ]

    cache = {}

    assert len(cache) == 0

    create_bundle(con, cache, queries, directory=bundle_dir)

    assert len(cache) == 0

    load_bundle(con, cache, directory=bundle_dir)

    assert len(cache) == 1
