# Mosaic DuckDB Server

The Mosaic `duckdb-server` package provides a Python-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

::: tip
This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](/core/) package.
:::

## Usage

To run the server from the Mosaic repository:

* Clone [https://github.com/uwdata/mosaic](https://github.com/uwdata/mosaic).
* Install [hatch](https://hatch.pypa.io/latest/install/), if not already present.
* Run `npm run server` to launch the server. This runs the server in development mode, so the server will restart if you change its code.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

Start the server in development with `hatch run serve`. The server restarts when you change the code.

To activate the environment, run `hatch shell`.

To set up a local certificate for SSL, use https://github.com/FiloSottile/mkcert.

The server support queries via HTTP GET and POST, and WebSockets. The GET endpoint is useful for debugging.
