import os
import re
from functools import partial

import ujson

from pkg.query import get_arrow_bytes, get_json, get_key, retrieve


def create_bundle(con, cache, queries, directory):
    describe_re = re.compile(r"^DESCRIBE ")
    pragma_re = re.compile(r"^PRAGMA ")
    view_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? VIEW")
    table_re = re.compile(r"^CREATE( TEMP| TEMPORARY)? TABLE( IF NOT EXISTS)? ([^\s]+)")

    manifest = {"tables": [], "queries": []}

    directory.mkdir(parents=True, exist_ok=True)

    for query in queries:
        sql = query if isinstance(query, str) else query.get("sql")

        if isinstance(query, dict) and query.get("alias"):
            table = query.get("alias")
            file = directory / f"{table}.parquet"
            con.execute(f"COPY ({sql}) TO '{file}' (FORMAT PARQUET)")
            manifest["tables"].append(table)

        elif sql.startswith("CREATE "):
            if view_re.match(sql):
                continue  # Ignore views

            table_match = table_re.match(sql)
            if table_match:
                table = table_match.group(3)
                file = directory / f"{table}.parquet"
                con.execute(sql)
                con.execute(f"COPY {table} TO '{file}' (FORMAT PARQUET)")
                manifest["tables"].append(table)

        elif not pragma_re.match(sql):
            command = "json" if describe_re.match(sql) else "arrow"
            key = get_key(sql, command)
            if command == "arrow":
                get = get_arrow_bytes
            elif command == "json":
                get = get_json
            else:
                raise ValueError(f"Unknown command {command}")
            result = retrieve(cache, {"sql": sql, "type": sql}, partial(get, con))
            with open(directory / key, "wb") as f:
                f.write(result)
            manifest["queries"].append(key)

    with open(directory / "bundle.json", "w") as f:
        ujson.dump(manifest, f, indent=2)

    return manifest


def load_bundle(con, cache, directory):
    with open(directory / "bundle.json") as f:
        manifest = ujson.load(f)

    # Load precomputed query results into the cache
    for key in manifest["queries"]:
        file = directory / key
        json_file = os.path.splitext(file)[1] == ".json"
        with open(file, "rb") as f:
            data = f.read()
            cache[key] = ujson.loads(data) if json_file else data

    # Load precomputed temp tables into the database
    for table in manifest["tables"]:
        file = directory / f"{table}.parquet"
        con.execute(f"CREATE TEMP TABLE IF NOT EXISTS {table} AS SELECT * FROM '{file}'")
