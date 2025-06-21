import logging
from hashlib import sha256

import pyarrow as pa

logger = logging.getLogger(__name__)


def get_key(sql, command):
    return f"{sha256(sql.encode('utf-8')).hexdigest()}.{command}"


def retrieve(cache, query, get):
    sql = query.get("sql")
    command = query.get("type")

    key = get_key(sql, command)
    result = cache.get(key)

    if result:
        logger.debug("Cache hit")
    else:
        result = get(sql)
        if query.get("persist", False):
            cache[key] = result
    return result


def get_arrow(con, sql):
    return con.query(sql).arrow()


def arrow_to_bytes(arrow):
    sink = pa.BufferOutputStream()
    with pa.ipc.new_stream(sink, arrow.schema) as writer:
        writer.write(arrow)
    return sink.getvalue().to_pybytes()


def get_arrow_bytes(con, sql):
    return arrow_to_bytes(get_arrow(con, sql))


def get_json(con, sql):
    result = con.query(sql).df()
    return result.to_json(orient="records")
