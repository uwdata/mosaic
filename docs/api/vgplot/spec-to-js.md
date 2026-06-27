---
description: Maps JSON/YAML spec syntax to the JavaScript API. Read the LLM Authoring Guide first for common mistakes and invalid APIs.
---

# Spec Format vs JavaScript API

Mosaic supports two ways to author vgplot visualizations:

- **JSON/YAML specifications** — consumed by the [Jupyter widget](/jupyter/), [`mosaic-spec`](/spec/) parser, and the [examples gallery](/examples/). Channel values, params, and plot attributes use declarative objects and strings.
- **JavaScript API** — functions exported from [`@uwdata/vgplot`](/vgplot/) (and re-exported SQL helpers from [`@uwdata/mosaic-sql`](/sql/)). Channel values are JavaScript expressions: column names, SQL builder calls, and tagged template literals.

Both formats compile to the same underlying queries. The most common documentation errors come from **copying spec-format objects into JavaScript code**. This page maps between the two.

::: tip
Import everything from one package in browser apps:

```js
import * as vg from "@uwdata/vgplot";
// vg.count(), vg.from(), vg.plot(), vg.Fixed, vg.sql, ...
```
:::

## Channel value mapping

In **spec format**, transforms and aggregates are single-key objects. In the **JS API**, use the corresponding function from `@uwdata/vgplot` (re-exported from `@uwdata/mosaic-sql` or `@uwdata/mosaic-plot`).

| Spec JSON / YAML | JavaScript API (`@uwdata/vgplot`) |
| --- | --- |
| `{ "count": null }` or `{ count: }` | `count()` |
| `{ "sum": "col" }` | `sum("col")` |
| `{ "avg": "col" }` | `avg("col")` |
| `{ "median": "col" }` | `median("col")` |
| `{ "min": "col" }` | `min("col")` |
| `{ "max": "col" }` | `max("col")` |
| `{ "bin": "col" }` | `bin("col")` or `bin("col", { steps: 20 })` |
| `{ "dateMonth": "d" }` | `dateMonth("d")` |
| `{ "dateMonthDay": "d" }` | `dateMonthDay("d")` |
| `{ "sql": "v + $point" }` | `` sql`v + ${$point}` `` |

See the [aggregate functions](/api/sql/aggregate-functions) and [date functions](/api/sql/date-functions) references for the full list of SQL builder methods.

### Aggregates in mark channels

SQL aggregate functions such as [`count()`](/api/sql/aggregate-functions#count) and [`sum()`](/api/sql/aggregate-functions#sum) are used in two contexts:

1. **Query builder** — `Query.from(...).select({ ... })` to build SQL (see [Queries](/api/sql/queries)).
2. **Mark channel values** — passed as encoding channels in vgplot marks.

::: code-group

``` json [JSON Spec]
{
  "mark": "barX",
  "data": { "from": "penguins" },
  "x": { "count": null },
  "y": "species",
  "fill": "species"
}
```

``` js [JavaScript API]
import { barX, count, from, plot } from "@uwdata/vgplot";

plot(
  barX(from("penguins"), { x: count(), y: "species", fill: "species" })
);
```

:::

### Side-by-side: binned histogram

::: code-group

``` yaml [YAML Spec]
plot:
- mark: rectY
  data: { from: flights, filterBy: $brush }
  x: { bin: delay }
  y: { count: null }
  fill: steelblue
```

``` js [JavaScript API]
vg.plot(
  vg.rectY(
    vg.from("flights", { filterBy: brush }),
    {
      x: vg.bin("delay"),
      y: vg.count(),
      fill: "steelblue"
    }
  )
);
```

:::

## Data sources: `from()`

In spec format, mark data is an object with a `from` key. In the JS API, pass the table name and options to `from()` as the first argument to a mark.

```js
from(tableName, {
  filterBy: selection,  // Selection or Param; filters this mark's query
  optimize: true,       // enable mark-specific optimizations (default true)
})
```

| Spec JSON / YAML | JavaScript API |
| --- | --- |
| `{ "from": "table" }` | `from("table")` |
| `{ "from": "table", "filterBy": "$sel" }` | `from("table", { filterBy: sel })` |
| `{ "from": "table", "optimize": false }` | `from("table", { optimize: false })` |

| Option | Description |
| --- | --- |
| `filterBy` | A [`Selection`](/core/#selections) or [`Param`](/core/#params) whose predicate filters rows for this mark. Use this to connect marks to cross-filters, menus, and brush interactors. |
| `optimize` | When `true` (default), connected marks such as `lineY` and `areaY` may apply [M4 optimization](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization). Set to `false` to disable. |

**`filterBy` applies to the data source, not the plot.** To filter a mark by a shared selection, pass `filterBy` inside `from()`:

```js
// ✓ correct
barX(from("sales", { filterBy: brush }), { x: count(), y: "region" })

// ✗ wrong — plot() has no filterBy option
plot(barX(from("sales"), { x: "region", y: count() }), { filterBy: brush })
```

Interactive filtering requires database-backed `from(table)` sources. Passing a raw array bypasses the coordinator and cannot respond to selections. See the [Marks API reference](/api/vgplot/marks).

## Params, selections, and plot attributes

| Spec JSON / YAML | JavaScript API |
| --- | --- |
| `"params": { "brush": { "select": "crossfilter" } }` | `const brush = Selection.crossfilter()` |
| `"params": { "threshold": 50 }` | `const threshold = Param.value(50)` |
| `"as": "$brush"` on an interactor or input | `as: brush` (pass the Param/Selection object) |
| `"colorDomain": "Fixed"` | `colorDomain(Fixed)` or `vg.colorDomain(vg.Fixed)` |
| `"xyDomain": "Fixed"` | `xyDomain(Fixed)` |
| `"xDomain": "Fixed"` | `xDomain(Fixed)` |

The string `"Fixed"` is **spec-only**. In JavaScript, import and call the `Fixed` sentinel exported by vgplot.

Param references in spec strings use a `$` prefix (`"$brush"`, `"value + $threshold"`). In JavaScript, interpolate Param/Selection instances directly (e.g. `` sql`value + ${threshold}` ``).

## SQL expressions

| Spec JSON / YAML | JavaScript API |
| --- | --- |
| `{ "sql": "v + $point" }` | `` sql`v + ${$point}` `` |
| `"y": "value + $threshold"` (invalid) | `` y: sql`value + ${threshold}` `` |

Plain strings are column names in both formats. SQL expressions in specs must use a `{ "sql": "..." }` object (see the [bias example](/examples/bias)).

## Complete cross-filter example

::: code-group

``` json [JSON Spec]
{
  "params": { "brush": { "select": "crossfilter" } },
  "vconcat": [
    {
      "plot": [
        {
          "mark": "dot",
          "data": { "from": "penguins", "filterBy": "$brush" },
          "x": "bill_length",
          "y": "bill_depth",
          "fill": "species"
        },
        { "select": "intervalXY", "as": "$brush" }
      ]
    },
    {
      "plot": [
        {
          "mark": "barX",
          "data": { "from": "penguins", "filterBy": "$brush" },
          "x": { "count": null },
          "y": "species",
          "fill": "species"
        }
      ]
    }
  ]
}
```

``` js [JavaScript API]
import * as vg from "@uwdata/vgplot";

const brush = vg.Selection.crossfilter();

vg.vconcat(
  vg.plot(
    vg.dot(vg.from("penguins", { filterBy: brush }), {
      x: "bill_length", y: "bill_depth", fill: "species"
    }),
    vg.intervalXY({ as: brush })
  ),
  vg.plot(
    vg.barX(vg.from("penguins", { filterBy: brush }), {
      x: vg.count(), y: "species", fill: "species"
    })
  )
);
```

:::

## Common mistakes

::: warning Read this first
The full checklist, invalid-API table, and canonical examples are in the **[LLM Authoring Guide](/llm-authoring)**. That page is included at the top of `llms.txt` and is the first section in the documentation index for code generation.
:::

Most errors come from **mixing spec format with the JavaScript API**, **inventing APIs**, or **wiring selections incorrectly**.

### Selection wiring

- **`intervalXY({ filterBy: brush })`** — wrong. Interactors **write** with `as`: `intervalXY({ as: brush })`.
- **`vg.filter(brush)`** — does not exist. Marks **read** with `from("table", { filterBy: brush })`.
- **`filterBy` on `plot()`** — wrong. Put `filterBy` on `from()`, not on `plot()`.

### Spec vs JavaScript syntax

- **`{ count: null }` or `{ count: true }` in JavaScript** — use `count()` in JS; in specs use `{ count: }` or `{ count: null }`, not `true`.
- **`"Fixed"` strings in JavaScript** — use the `Fixed` sentinel: `xDomain(Fixed)`, not `"Fixed"`.
- **SQL expressions as plain strings** — in specs use `{ "sql": "v + $param" }`; in JS use `` sql`v + ${param}` ``.
- **Vega-Lite / Altair syntax in specs** — `timeUnit`, `mean`, `colorLegend: true` are not Mosaic. Use `{ dateMonth: date }`, `{ avg: col }`, `- legend: color`.

### Python

- **No fluent Python API** — do not generate `import mosaic as ms` or `ms.plot()`. Use [`MosaicWidget`](/jupyter/) with a YAML/JSON spec.

### DuckDB-WASM and environment

- **Bare filenames with DuckDB-WASM** — paths like `"data.csv"` fail in the browser. Pass a full HTTP URL and set `forceFullHTTPReads: true`:

  ```js
  vg.coordinator().databaseConnector(vg.wasmConnector({
    config: { filesystem: { forceFullHTTPReads: true } }
  }));
  await vg.coordinator().exec(
    vg.loadCSV("stocks", `${window.location.origin}/stocks.csv`)
  );
  ```

- **Wrong package or coordinator** — `@uwdata/vgplot`, not `@uwdata/mosaic-vgplot`; `databaseConnector()`, not `database()`.
- **Running browser code with Node** — vgplot with `wasmConnector()` requires a browser (or bundler such as Vite).

When in doubt, check the [LLM Authoring Guide](/llm-authoring) and [schema reference](/api/spec/schema-reference).

## When to use which format

| Use case | Recommended format |
| --- | --- |
| Jupyter notebooks | JSON/YAML spec + [`MosaicWidget`](/jupyter/) |
| Browser apps and Observable | JavaScript API |
| Sharing examples in docs | YAML spec (with JS equivalent in [code groups](/vgplot/#plots)) |
| Programmatic code generation | `mosaic-spec` parser (`parseSpec`, `astToDOM`, `astToESM`) |

The [examples gallery](/examples/) and [Jupyter widget](/jupyter/) primarily use JSON/YAML specs. Browser applications typically use the JavaScript API. Both compile to the same queries — use this page to translate between them.

For a minimal working JavaScript project, see [`packages/examples/vanilla-example`](https://github.com/uwdata/mosaic/tree/main/packages/examples/vanilla-example) in the Mosaic repository.
