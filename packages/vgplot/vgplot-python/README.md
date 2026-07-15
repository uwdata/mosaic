# vgplot

[![PyPI](https://img.shields.io/pypi/v/vgplot.svg)](https://pypi.org/project/vgplot/)

A Python API for authoring [Mosaic](https://uwdata.github.io/mosaic/) visualizations. Build declarative, interactive plots backed by DuckDB — in notebooks, as JSON specs, or as part of a data pipeline.

`vgplot` produces Mosaic `View` objects that can be rendered with [`mosaic-widget`](https://pypi.org/project/mosaic-widget/) or exported to JSON for use in a browser. Data sources and parameters defined as local variables are automatically discovered at render time.

## Installation

```bash
pip install vgplot
```

To render visualizations in the widget, install the widget:

```bash
pip install mosaic-widget
```

## Usage

### File-based data

Load data from a file using `vg.parquet()`, `vg.csv()`, or `vg.table()`, pass it directly to a mark, then call `view.show()` or `view`:

```python
import vgplot as vg

athletes = vg.parquet("data/athletes.parquet")

view = vg.plot(
    vg.dot(athletes, x="weight", y="height", fill="sex", opacity=0.5),
    vg.width(600),
    vg.height(400),
)

view
```

### Interactive selections

Params and selections are first-class objects. Declare them before the view so they can be referenced by multiple marks or interactors:

```python
import vgplot as vg

flights = vg.parquet("data/flights-200k.parquet")
brush = vg.selection.crossfilter()

view = vg.vconcat(
    vg.plot(
        vg.rect_y(flights, x=vg.bin("delay"), y=vg.count(),
                  filter_by=brush, fill="steelblue",
                  inset_left=0.5, inset_right=0.5),
        vg.interval_x(bind=brush),
        vg.x_domain("Fixed"),
        vg.x_label("Arrival Delay (min)"),
        vg.height(200),
    ),
    vg.plot(
        vg.rect_y(flights, x=vg.bin("time"), y=vg.count(),
                  filter_by=brush, fill="steelblue",
                  inset_left=0.5, inset_right=0.5),
        vg.interval_x(bind=brush),
        vg.x_domain("Fixed"),
        vg.x_label("Departure Time (hour)"),
        vg.height(200),
    ),
)

view
```

### Scalar params and input widgets

Use `vg.param()` for scalar parameters bound to input controls:

```python
import vgplot as vg

walk = vg.parquet("data/random-walk.parquet")
bias = vg.param(0)

view = vg.vconcat(
    vg.slider(label="Bias", bind=bias, min=0, max=1000, step=1),
    vg.plot(
        vg.area_y(walk, x="t", y=vg.sql("v + $bias")),
        vg.width(680),
        vg.height(200),
    ),
)

view
```

## Key concepts

| Concept | Python API |
|---|---|
| File-based data | `vg.parquet(path)`, `vg.csv(path)`, `vg.spatial(path)`, `vg.table(query)` |
| Mark | `vg.dot(...)`, `vg.bar_y(...)`, `vg.area_y(...)`, `vg.line_y(...)`, … |
| Aggregation / transform | `vg.count()`, `vg.bin("col")`, `vg.avg("col")`, `vg.sum("col")`, … |
| SQL expression | `vg.sql("expr")` — use `$param` to interpolate a param, e.g. `vg.sql("v + $bias")` |
| Plot attributes | `vg.width(n)`, `vg.height(n)`, `vg.x_label("…")`, `vg.color_scheme("…")`, … |
| Interactor | `vg.interval_x(...)`, `vg.interval_xy(...)`, `vg.region(...)`, `vg.highlight(...)`, … |
| Layout | `vg.vconcat(...)`, `vg.hconcat(...)`, `vg.vspace(n)`, `vg.hspace(n)` |
| Crossfilter selection | `vg.selection.crossfilter()` |
| Intersect / union selection | `vg.selection.intersect()`, `vg.selection.union()` |
| Scalar param | `vg.param(value)` |
| Input widgets | `vg.slider(...)`, `vg.menu(...)`, `vg.select(...)`, `vg.checkbox(...)` |
| Named data reference | `vg.source("table_name")` |
| Render | `view.show()` or `view` as last cell expression in notebooks |

Option names match the [vgplot API reference](https://uwdata.github.io/mosaic/api/), but in snake_case. For example, `xDomain` → `x_domain`, `colorScheme` → `color_scheme`, `filterBy` → `filter_by`.

Any mark or directive not listed above is also accessible by its snake_case name — `vg.regression_y(...)` and `vg.x_tick_rotate(45)` work without explicit exports.

## Exporting specs

`view.to_dict()` returns a plain Python dictionary. `view.to_json()` returns a JSON string:

```python
from pprint import pprint

pprint(view.to_dict())
print(view.to_json(indent=2))
```
