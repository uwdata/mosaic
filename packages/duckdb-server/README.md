# Mosaic DuckDB Server

[![PyPi](https://img.shields.io/pypi/v/mosaic-server.svg)](https://pypi.org/project/mosaic-server/)

A web server that serves DuckDB queries.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

Start the server in development with `hatch run serve`. The server restarts when you change the code.

To activate the environment, run `hatch shell`.

To set up a local certificate for SSL, use https://github.com/FiloSottile/mkcert.

## Publishing

Run the build with `hatch build`. Then publish with `hatch publish`. We publish using tokens so when asked, set the username to `__token__` and then use your token as the password.
