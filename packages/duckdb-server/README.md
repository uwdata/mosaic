# Mosaic DuckDB Server

[![PyPi](https://img.shields.io/pypi/v/duckdb-server.svg)](https://pypi.org/project/duckdb-server/)

A Python-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

_Note:_ This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic-core) package.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

Start the server in development with `hatch run serve`. The server restarts when you change the code.

To activate the environment, run `hatch shell`.

To set up a local certificate for SSL, use https://github.com/FiloSottile/mkcert.

The server support queries via HTTP GET and POST, and WebSockets. The GET endpoint is useful for debugging. For example, you can query it with at [this url](<http://localhost:3000/?query={"sql":"select 1","type":"json"}>).

## Publishing

Run the build with `hatch build`. Then publish with `hatch publish`. We publish using tokens so when asked, set the username to `__token__` and then use your token as the password.
