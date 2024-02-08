# Mosaic DuckDB Server

[![PyPi](https://img.shields.io/pypi/v/mosaic-server.svg)](https://pypi.org/project/mosaic-server/)

A web server that serves DuckDB queries.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

Start the server in development with `hatch run serve`. The server restarts when you change the code.

To activate the environment, run `hatch shell`.

To set up a local certificate for SSL, use https://github.com/FiloSottile/mkcert.

The server support queries via HTTP GET and POST, and WebSockets. The GET endpoint is useful for debugging. For example, you can query it with at [this url](<http://localhost:3000/?query={"sql":"select 1","type":"json"}>).

## Publishing

Run the build with `hatch build`. Then publish with `hatch publish`. We publish using tokens so when asked, set the username to `__token__` and then use your token as the password.
