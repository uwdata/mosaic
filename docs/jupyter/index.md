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

The [`vgplot` Python API](/vgplot/?lang=python) lets you build the specification programmatically instead of loading a YAML/JSON file. Define a data source as a local variable (e.g. `vg.csv(...)` or `vg.parquet(...)`) and pass it directly to a mark — `view` discovers it by name, so the resulting spec is self-contained and can be passed straight to `MosaicWidget`:

```python
import vgplot as vg

from mosaic_widget import MosaicWidget

weather = vg.csv("https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv")

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

To plot an existing Pandas or Polars DataFrame instead, register it with the widget under a table name and reference it from a mark with `vg.source("name")`:

```python
import pandas as pd
import vgplot as vg

from mosaic_widget import MosaicWidget

weather = pd.read_csv("https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv", parse_dates=["date"])

view = vg.plot(
    vg.dot(vg.source("weather"), x=vg.date_month_day("date"), y="temp_max", fill="weather"),
    vg.x_tick_format("%b"),
    vg.width(680),
)

MosaicWidget(view, data={"weather": weather})
```

### Loading a YAML/JSON spec

Alternatively, load an existing declarative specification and pass it to the widget as a dictionary:

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
