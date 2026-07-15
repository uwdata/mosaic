# Mosaic Jupyter Widget

The Mosaic `widget` package provides a Jupyter widget for creating interactive Mosaic plots over Pandas and Polars data frames or DuckDB connections.

## Installation

Install the widget with `pip install mosaic-widget`. Then you can import it in Jupyter with `import mosaic_widget`.

The PyPI package is at https://pypi.org/project/mosaic-widget/. The widget also works in [Google Colab](https://colab.research.google.com/drive/1Txy6L_of8_lJFImKEkhUCqZX70yKpYnv#scrollTo=leuzblN47K-T&line=1&uniqifier=1).

## Using the Widget

After importing the widget with

```python
from mosaic_widget import MosaicWidget
```

you can initialize and show the widget with

```python
widget = MosaicWidget()
widget
```

The widget constructor take three arguments which are all optional.

* `spec`, a Mosaic specification as a dictionary. This argument is optional and can be set later via the `spec` traitlet.
* `con`, a DuckDB connection. If `None`, the widget will create a connection to an in-memory database.
* `data`, a dictionary of data frames that should be added to the database connection. The keys of the dictionary are the table names.

A widget has a `spec` traitlet that can be used to set the Mosaic specification. A widget automatically updates when the specification changes. A widget also has a `params` traitlet, which updates automatically with params in the widget. The params are a dictionary from parameter name to the current `value` of the parameter and the `predicate` which can be used as the WHERE clause in a SQL query.

## Example

In this example, we create a Mosaic plot over the Seattle weather dataset. This will render [an interactive view of Seattle’s weather, including maximum temperature, amount of precipitation, and type of weather](/examples/weather.html). You can try a live example on [Google Colab](https://colab.research.google.com/drive/1Txy6L_of8_lJFImKEkhUCqZX70yKpYnv#scrollTo=leuzblN47K-T&line=1&uniqifier=1).

### Building a spec with the vgplot Python API

The [`vgplot` Python API](/vgplot/?lang=python) lets you build the specification programmatically instead of loading a YAML/JSON file. Load your data — a Polars or Pandas DataFrame (`pl.read_csv`), or a file source with `vg.csv(...)` / `vg.parquet(...)` — assign it to a variable, and pass that variable straight to a mark. It's picked up by its variable name (an in-memory DataFrame is registered as a table, a file source is inlined), so you can hand the view straight to `MosaicWidget` with no separate `data` argument:

```python
import polars as pl
import vgplot as vg

from mosaic_widget import MosaicWidget

weather = pl.read_csv(
    "https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv",
    try_parse_dates=True,
)

view = vg.plot(
    vg.dot(
        weather,
        x=vg.date_month_day("date"),
        y="temp_max",
        fill="weather",
        r="precipitation",
        fill_opacity=0.7,
    ),
    vg.x_tick_format("%b"),
    vg.width(680),
    vg.height(300),
)

MosaicWidget(view)
```

To register the data yourself instead, pass `data={"weather": weather}` to `MosaicWidget` and reference the table from a mark with `vg.source("weather")`.

### Loading a YAML/JSON spec

Alternatively, load an existing declarative specification and pass it to the widget as a dictionary:

```python
import polars as pl
import yaml

from mosaic_widget import MosaicWidget

weather = pl.read_csv(
    "https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv",
    try_parse_dates=True,
)

# Load weather spec, remove data key to ensure load from the DataFrame
with open("weather.yaml") as f:
    spec = yaml.safe_load(f)
    spec.pop("data")

MosaicWidget(spec, data={"weather": weather})
```

### Listening to parameter changes

A widget's `params` traitlet updates automatically as the user interacts with the plot. Call `observe` on the widget to react to those changes. Here we build the spec with the vgplot API, add an interval selection to brush over, and print the params into an output widget:

```python
from pprint import pprint

import ipywidgets as widgets
import polars as pl
import vgplot as vg

from mosaic_widget import MosaicWidget

weather = pl.read_csv(
    "https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv",
    try_parse_dates=True,
)

brush = vg.selection.intersect()

view = vg.plot(
    vg.dot(
        weather,
        x=vg.date_month_day("date"),
        y="temp_max",
        fill="weather",
        select=vg.interval_x(bind=brush),
    ),
    vg.x_tick_format("%b"),
    vg.width(680),
)

widget = MosaicWidget(view)

output = widgets.Output()

@output.capture(clear_output=True)
def handle_change(change):
    pprint(change.new)

widget.observe(handle_change, names=["params"])

widgets.VBox([widget, output])
```

## Reading the Filtered Data

After the user interacts with the widget, you can read the current selections as SQL and fetch the filtered rows directly from Python:

```python
widget.sql            # 'SELECT * FROM "weather" WHERE ("weather" = \'sun\')'
widget.data().df()    # pandas DataFrame of the currently filtered rows
```

`widget.sql` combines the active selection predicates from `params` with `AND`. `widget.data()` returns the lazy [DuckDB relation](https://duckdb.org/docs/api/python/relational_api) for that query; materialize it with `.df()` (pandas), `.pl()` (Polars), `.arrow()`, or `.fetchall()`.

`widget.data()` infers the source table from the spec's `data` entries and the `data` constructor argument. If those name more than one table, pass the table explicitly (`widget.sql` returns `None` in that case). The query applies every selection; pass `filter_by` with a selection name or a list of names to apply a subset:

```python
widget.data("weather").df()                     # explicit source table
widget.data("weather", filter_by="range").df()  # apply only the "range" selection
```

Note that in a cross-filtered view each chart skips its own selection, but `widget.data()` applies all of them, so a chart may show more rows than `widget.data()` returns.
