# Mosaic Widget

## Installation

Install the widget with `pip install mosaic-widget`. Then you can import it in Jupyter with `import mosaic_widget`.

Use `mosaic_widget.MosaicWidget` to create a widget. The constructor takes two arguments: first a Mosaic spec and second a DuckDB database connection. If the connection is `None`, the widget will create a connection to an in-memory database.

The PyPI package is at https://pypi.org/project/mosaic-widget/.

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

To active the environment, run `hatch shell`.

This should install the widget in development mode so you can start Jupyter.

You can start Jupyter with `jupyter lab --notebook-dir=../../dev/notebooks`. If you cannot import the widget module, make sure that your Jupyter uses the right environment. You can add your environment to Jupyter by running `python -m ipykernel install --user --name=mosaic` and then select `mosaic` in the Jupyter environment dropdown.

Run `npm run build` to build the widget JavaScript code. If you want to live edit the widget code, run `npm run watch` in a separate terminal and change `_DEV = False` to `_DEV = False` inside `mosaic_widget/__init__.py`.

## Publishing

First, make sure that you set `_DEV = False`. Run the build with `npm run build` and `hatch build`. Then publish with `hatch publish`.
