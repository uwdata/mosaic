# vgplot

[![PyPI](https://img.shields.io/pypi/v/vgplot.svg)](https://pypi.org/project/vgplot/)

A Python API for authoring [Mosaic](https://uwdata.github.io/mosaic/) visualizations. Build declarative, interactive plots backed by DuckDB — in Jupyter notebooks, as JSON specs, or as part of a data pipeline.

`vgplot` produces Mosaic specification objects that can be rendered with [`mosaic-widget`](https://pypi.org/project/mosaic-widget/) in JupyterLab or exported to JSON for use in the browser.

## Installation

```bash
pip install vgplot
```

To render visualizations in Jupyter, also install the widget:

```bash
pip install mosaic-widget
```

## Usage

Build a spec with `import vgplot as vg`, then pass it to a `MosaicWidget`:

```python
import vgplot as vg
from mosaic_widget import MosaicWidget

_data = vg.data(athletes=vg.parquet("data/athletes.parquet"))

_view = vg.plot(
    vg.dot(data=vg.from_("athletes"), x="weight", y="height", fill="steelblue", opacity=0.5),
    vg.width(600),
    vg.height(400),
)

spec = vg.spec(data=_data, view=_view)
MosaicWidget(spec.to_dict())
```

### Interactive selections

Params and selections are first-class objects. Declare them before the view so they can be referenced by multiple marks or interactors:

```python
import vgplot as vg
from mosaic_widget import MosaicWidget

_data = vg.data(flights=vg.parquet("data/flights-200k.parquet"))

brush = vg.Selection.crossfilter()

_view = vg.vconcat(
    vg.plot(
        vg.rect_y(data={"from": "flights", "filterBy": brush},
                  x={"bin": "delay"}, y={"count": ""},
                  fill="steelblue", inset_left=0.5, inset_right=0.5),
        {"select": "intervalX", "as": brush},
        vg.x_domain("Fixed"),
        vg.x_label("Arrival Delay (min)"),
        vg.height(200),
    ),
    vg.plot(
        vg.rect_y(data={"from": "flights", "filterBy": brush},
                  x={"bin": "time"}, y={"count": ""},
                  fill="steelblue", inset_left=0.5, inset_right=0.5),
        {"select": "intervalX", "as": brush},
        vg.x_domain("Fixed"),
        vg.x_label("Departure Time (hour)"),
        vg.height(200),
    ),
)

spec = vg.spec(data=_data, params={"brush": brush}, view=_view)
MosaicWidget(spec.to_dict())
```

### Scalar params and input widgets

Use `vg.Param.value()` for scalar parameters bound to input controls:

```python
import vgplot as vg
from mosaic_widget import MosaicWidget

_data = vg.data(walk=vg.parquet("data/random-walk.parquet"))

point = vg.Param.value(0)

_view = vg.vconcat(
    vg.slider(label="Bias", as_=point, min=0, max=1000, step=1),
    vg.plot(
        vg.area_y(data=vg.from_("walk"), x="t", y={"sql": "v + $point"}, fill="steelblue"),
        vg.width(680),
        vg.height(200),
    ),
)

spec = vg.spec(data=_data, params={"point": point}, view=_view)
MosaicWidget(spec.to_dict())
```

## Key concepts

| Concept | Python API |
|---|---|
| Load data | `vg.parquet(path)`, `vg.table(query)` |
| Mark | `vg.dot(...)`, `vg.bar_y(...)`, `vg.area_y(...)`, `vg.line_y(...)`, … |
| Plot attributes | `vg.width(n)`, `vg.height(n)`, `vg.x_label("…")`, `vg.color_scheme("…")`, … |
| Layout | `vg.vconcat(...)`, `vg.hconcat(...)`, `vg.vspace(n)`, `vg.hspace(n)` |
| Crossfilter selection | `vg.Selection.crossfilter()` |
| Intersect / union selection | `vg.Selection.intersect()`, `vg.Selection.union()` |
| Scalar param | `vg.Param.value(initial)` |
| Input widgets | `vg.slider(...)`, `vg.select(...)`, `vg.checkbox(...)` |
| Reference a dataset | `vg.from_("table_name")` |
| Assemble | `vg.spec(meta=…, data=…, params=…, view=…)` |

Any mark or directive not listed above is also accessible by its snake_case name via `__getattr__`, so `vg.regression_y(...)` and `vg.x_tick_rotate(45)` work without explicit exports.

Option names match the [vgplot API reference](https://uwdata.github.io/mosaic/api/), but in snake_case. For example, `xDomain` → `x_domain`, `colorScheme` → `color_scheme`.

## Exporting specs

`Spec.to_dict()` returns a plain Python dictionary compatible with `mosaic-widget`. `Spec.to_json()` returns a JSON string:

```python
print(spec.to_json(indent=2))
```