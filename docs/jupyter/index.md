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
* `data`, a dictionary of DataFrames that should be added to the database connection. The keys of the dictionary are the table names.

The widget has a `spec` traitlet that can be used to set the Mosaic specification. The widget will automatically update when the specification changes. The widget also has a `selections` traitlet, which updates automatically with selections in the widget.

## Example

In this example, we create a Mosaic plot over the Seattle weather dataset. This will render the [an interactive view of Seattle’s weather, including maximum temperature, amount of precipitation, and type of weather](/examples/weather.html). You can try a live example on [Google Colab](https://colab.research.google.com/drive/1Txy6L_of8_lJFImKEkhUCqZX70yKpYnv#scrollTo=leuzblN47K-T&line=1&uniqifier=1).

```python
import pandas as pd
import yaml
from mosaic_widget import MosaicWidget

weather = pd.read_csv("https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv", parse_dates=['date'])

# Load weather spec, remove data key to ensure load from Pandas
with open("weather.yaml") as f:
    spec = yaml.safe_load(f)
    spec.pop("data")

MosaicWidget(spec, data = {"weather": weather})
```
