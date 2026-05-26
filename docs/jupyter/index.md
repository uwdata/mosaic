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

In this example, we create a Mosaic plot over the Seattle weather dataset. This will render the [an interactive view of Seattle’s weather, including maximum temperature, amount of precipitation, and type of weather](/examples/weather.html). You can try a live example on [Google Colab](https://colab.research.google.com/drive/1Txy6L_of8_lJFImKEkhUCqZX70yKpYnv#scrollTo=leuzblN47K-T&line=1&uniqifier=1).

```python
import pandas as pd
import yaml

from mosaic_widget import MosaicWidget

weather = pd.read_csv("https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv", parse_dates=["date"])

# Load weather spec, remove data key to ensure load from Pandas
with open("weather.yaml") as f:
    spec = yaml.safe_load(f)
    spec.pop("data")

MosaicWidget(spec, data = {"weather": weather})
```

To listen to changes of the `params`, you can add call `observe` on the widget created with `MosaicWidget`. In the following example, we show the params in an output widget.

```python
from pprint import pprint
import ipywidgets as widgets
import pandas as pd
import yaml

from mosaic_widget import MosaicWidget

weather = pd.read_csv("https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv", parse_dates=["date"])

# Load weather spec, remove data key to ensure load from Pandas
with open("weather.yaml") as f:
    spec = yaml.safe_load(f)
    spec.pop("data")

widget = MosaicWidget(spec, data = {"weather": weather})

output = widgets.Output()

@output.capture(clear_output=True)
def handle_change(change):
    pprint(change.new)

widget.observe(handle_change, names=["params"])

widgets.VBox([widget, output])
```

## Reading the Filtered Data

After the user interacts with the widget, you can read the current SQL state and the filtered rows directly from Python:

```python
widget.sql     # 'SELECT * FROM "weather" WHERE ("weather" = \'sun\')'
widget.data()  # pandas DataFrame of the currently filtered rows
```

`widget.sql` builds a `SELECT * FROM <table>` statement and combines every active selection predicate from `params` with `AND`. The source table and its `filterBy` selections are discovered from the spec's mark `data: { from, filterBy }` blocks.

For specs that reference more than one source table, name the table explicitly:

```python
widget.data("weather")
```

To limit which selections are applied, pass `filter_by` with a selection name or a list of names:

```python
widget.data("weather", filter_by="range")
widget.data("weather", filter_by=["click", "range"])
```

If you need a different return type, run the SQL yourself on the widget's DuckDB connection: `widget.con.query(widget.sql).pl()` for Polars, `.arrow()` for an Arrow table, and so on.
