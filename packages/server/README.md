# Mosaic Web Server

[![PyPi](https://img.shields.io/pypi/v/mosaic-server.svg)](https://pypi.org/project/mosaic-server/)

A web server that serves DuckDB queries.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

To activate the environment, run `hatch shell`.

This should install the widget in development mode so you can start Jupyter.

Start the server in development with `hatch run serve`. The server restarts when you change the code.

## Publishing

Run the build with `hatch build`. Then publish with `hatch publish`. We publish using tokens so when asked, set the username to `__token__` and then use your token as the password.
