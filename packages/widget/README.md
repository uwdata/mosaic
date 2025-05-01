# Mosaic Widget

[![PyPi](https://img.shields.io/pypi/v/mosaic-widget.svg)](https://pypi.org/project/mosaic-widget/)

A Jupyter widget for Mosaic. Given a declarative specification, will generate web-based visualizations while leveraging DuckDB in the Jupyter kernel. Create interactive Mosaic plots over Pandas and Polars data frames or DuckDB connections.

Learn how to install and use the widget in the [Mosaic documentation](https://uwdata.github.io/mosaic/jupyter/).

## Developer Setup

We use [uv](https://docs.astral.sh/uv/) to manage our development setup.

You can start Jupyter with `ANYWIDGET_HMR=1 uv run jupyter lab --notebook-dir=../../dev/notebooks`.

Run `npm run build` to build the widget JavaScript code. If you want to live edit the widget code, run `npm run dev` in a separate terminal.

Run `uv run ruff check --fix` and `uv run ruff format` to lint the code.

## Publishing

Run the build with `uv build`. Then publish with `uvx twine upload --skip-existing ../../dist/*`. We publish using tokens so when asked, set the username to `__token__` and then use your token as the password. Alternatively, create a [`.pypirc` file](https://packaging.python.org/en/latest/guides/distributing-packages-using-setuptools/#create-an-account).
