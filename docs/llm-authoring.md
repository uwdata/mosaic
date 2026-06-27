---
description: REQUIRED READING before generating Mosaic code. Lists APIs that do not exist, selection wiring rules, and canonical JavaScript and Python examples.
---

# LLM Authoring Guide

<llm-only>

**Read this page before generating any Mosaic code.** Most generated examples fail by inventing APIs, mixing spec format with JavaScript, or confusing `as` with `filterBy` on selections.

</llm-only>

Mosaic has **two authoring formats** — not one unified API across languages:

| Target | Format | Entry point |
| --- | --- | --- |
| Browser / Node (bundled) | JavaScript API | `import * as vg from "@uwdata/vgplot"` |
| Python / Jupyter | JSON or YAML spec | `from mosaic_widget import MosaicWidget` |

There is **no** Python fluent API (`ms.plot()`, `ms.dot()`, …). Do not invent one.

See also [Spec Format vs JavaScript API](/api/vgplot/spec-to-js) for the full syntax mapping and [Spec Schema Reference](/api/spec/schema-reference) for valid spec option names.

## APIs that do not exist

If you cannot find a name in the docs or schema reference, **do not use it**.

| Wrong (hallucinated) | Correct |
| --- | --- |
| `@uwdata/mosaic-vgplot` | `@uwdata/vgplot` |
| `coordinator.database(connector)` | `vg.coordinator().databaseConnector(connector)` |
| `vg.filter(selection)` on a plot | `from("table", { filterBy: selection })` on the mark |
| `intervalXY({ filterBy: brush })` | `intervalXY({ as: brush })` — interactors **write** via `as` |
| `plot(..., { filterBy: brush })` | `from("table", { filterBy: brush })` on each mark |
| `import mosaic as ms` / `ms.plot()` | `MosaicWidget(spec, data={...})` with a YAML/JSON spec |
| `ms.from_()`, `ms.count()`, `ms.vconcat()` | Spec keys + `MosaicWidget`; no Python mark builders |
| `colorLegend: true` in a spec | `- legend: color` as a plot entry (see [weather example](/examples/weather)) |
| `{ timeUnit: month, field: date }` in spec | `{ dateMonth: date }` or `{ bin: date, interval: month }` |
| `{ mean: col }` in spec | `{ avg: col }` |
| `{ count: true }` in spec | `{ count: }` or `{ count: null }` — not `true` |

## Selection wiring (`as` vs `filterBy`)

Selections connect interactors/inputs to marks. **Every interactive filter needs both a writer and a reader.**

| Role | Option | Used on |
| --- | --- | --- |
| **Write** filter predicates into a selection | `as: selection` | Interactors (`intervalXY`, `intervalX`, …), inputs (`menu`, `search`, …) |
| **Read** filter predicates from a selection | `filterBy: selection` | Mark data sources: `from("table", { filterBy: sel })`, `table({ filterBy: sel })` |

::: code-group

``` js [JavaScript — correct]
const brush = vg.Selection.crossfilter();

vg.plot(
  vg.dot(vg.from("weather"), { x: "date", y: "temp_max", fill: "weather" }),
  vg.intervalXY({ as: brush })  // writes to brush
);

vg.plot(
  vg.barX(vg.from("weather", { filterBy: brush }), {  // reads from brush
    x: vg.count(), y: "weather", fill: "weather"
  })
);
```

``` yaml [YAML spec — correct]
params:
  brush: { select: crossfilter }
vconcat:
  - plot:
      - mark: dot
        data: { from: weather }
        x: date
        y: temp_max
        fill: weather
      - select: intervalXY
        as: $brush          # writes
  - plot:
      - mark: barX
        data: { from: weather, filterBy: $brush }  # reads
        x: { count: }
        y: weather
        fill: weather
```

``` js [JavaScript — wrong]
// ✗ filterBy on interactor — does not write to the selection
vg.intervalXY({ filterBy: brush });

// ✗ vg.filter() does not exist
vg.plot(vg.barX(vg.from("weather"), { x: vg.count(), y: "weather" }), vg.filter(brush));
```

:::

## Canonical JavaScript example

Copy this structure for browser apps. Adjust table name, columns, and layout.

```js
import * as vg from "@uwdata/vgplot";

vg.coordinator().databaseConnector(vg.wasmConnector({
  config: { filesystem: { forceFullHTTPReads: true } }
}));

await vg.coordinator().exec(
  vg.loadCSV("weather", "https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv")
);

const brush = vg.Selection.crossfilter();

const dashboard = vg.vconcat(
  vg.plot(
    vg.dot(vg.from("weather"), { x: "date", y: "temp_max", fill: "weather" }),
    vg.intervalXY({ as: brush }),
    vg.xyDomain(vg.Fixed),
    vg.width(680),
    vg.height(300)
  ),
  vg.plot(
    vg.barX(vg.from("weather", { filterBy: brush }), {
      x: vg.count(), y: "weather", fill: "weather"
    }),
    vg.xDomain(vg.Fixed),
    vg.width(680),
    vg.height(200)
  )
);

document.getElementById("app").appendChild(dashboard);
```

Notes:

- Use `vg.count()`, `vg.bin("col")`, `vg.avg("col")` — never `{ count: null }` in JavaScript.
- Use `vg.Fixed`, not the string `"Fixed"`.
- Load remote files with a full URL and `forceFullHTTPReads: true` on the WASM connector.

## Canonical Python / Jupyter example

```python
import pandas as pd
import yaml
from mosaic_widget import MosaicWidget

weather = pd.read_csv(
    "https://uwdata.github.io/mosaic-datasets/data/seattle-weather.csv",
    parse_dates=["date"],
)

SPEC = """
params:
  brush: { select: crossfilter }
vconcat:
  - plot:
      - mark: dot
        data: { from: weather }
        x: date
        y: temp_max
        fill: weather
      - select: intervalXY
        as: $brush
    xyDomain: Fixed
    width: 680
    height: 300
  - plot:
      - mark: barX
        data: { from: weather, filterBy: $brush }
        x: { count: }
        y: weather
        fill: weather
    xDomain: Fixed
    width: 680
    height: 200
"""

MosaicWidget(yaml.safe_load(SPEC), data={"weather": weather})
```

Notes:

- Pass DataFrames via `data={"table_name": df}`; do not load a DataFrame in Python without passing it to the widget.
- If the spec has a `data:` block for the same table, call `spec.pop("data", None)` before passing Python data.
- Use YAML spec syntax only — not JavaScript, not Vega-Lite (`timeUnit`, `colorLegend: true`, etc.).

## Spec format vs JavaScript

The docs and examples gallery show many **YAML/JSON specs**. When the user asks for **JavaScript**, translate using [Spec Format vs JavaScript API](/api/vgplot/spec-to-js):

- `{ count: }` in spec → `count()` in JS
- `{ bin: "col" }` → `bin("col")`
- `{ avg: "col" }` → `avg("col")`
- `{ dateMonth: "d" }` → `dateMonth("d")`
- `"filterBy": "$sel"` in spec data → `from("table", { filterBy: sel })` in JS (pass the Selection object, not a string)

## Checklist before returning code

1. **Language** — JavaScript uses `@uwdata/vgplot`; Python uses `MosaicWidget` + YAML/JSON spec.
2. **Package** — `@uwdata/vgplot`, not `@uwdata/mosaic-vgplot` or `@uwdata/mosaic-vgplot`.
3. **Coordinator** — `databaseConnector()`, not `database()`.
4. **Selections** — interactors/inputs use `as`; marks use `filterBy` on `from()`.
5. **Aggregates** — function calls in JS (`count()`); single-key objects in spec (`{ count: }`).
6. **Spec names** — verify transforms and plot options against the [schema reference](/api/spec/schema-reference); do not import Vega-Lite or Altair conventions.
