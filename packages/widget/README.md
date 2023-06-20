# Mosaic Widget

A Jupyter Widget for Mosaic. Create interactive Mosaic plots over Pandas and Polars data frames or DuckDB connections.

Learn how to install and use the widget in the [Mosaic documentation](https://uwdata.github.io/mosaic/jupyter/).

## Developer Setup

We use [hatch](https://hatch.pypa.io/latest/) to manage our development setup.

To activate the environment, run `hatch shell`.

This should install the widget in development mode so you can start Jupyter.

You can start Jupyter with `jupyter lab --notebook-dir=../../dev/notebooks`. If you cannot import the widget module, make sure that your Jupyter uses the right environment. You can add your environment to Jupyter by running `python -m ipykernel install --user --name=mosaic` and then select `mosaic` in the Jupyter environment dropdown.

Run `npm run build` to build the widget JavaScript code. If you want to live edit the widget code, run `npm run dev` in a separate terminal and change `_DEV = False` to `_DEV = True` inside `mosaic_widget/__init__.py`.

## Publishing

First, make sure that you set `_DEV = False`. Run the build with `npm run build` and `hatch build`. Then publish with `hatch publish`.
