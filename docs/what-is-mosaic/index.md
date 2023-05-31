<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# What is Mosaic?

Mosaic is a framework for linking data visualizations, tables, input widgets, and other data-driven components, while leveraging a database for scalable processing. With Mosaic, you can interactively visualize and explore millions and even billions of data points.

A key idea is that interface components &ndash; Mosaic _clients_ &ndash; publish their data needs as queries that are managed by a central _coordinator_. The coordinator may further optimize queries before issuing them to a backing _data source_ such as [DuckDB](/duckdb/).

Reactive variables for individual values (_params_) or filter criteria (_selections_) enable linked interaction among clients and the coordinator. A slider might update a _param_ value that parameterizes other clients. Or, interactions with charts or input widgets can populate a _selection_, which the coordinator uses to query filtered data and update linked clients.

::: tip
This website uses WebAssembly to run DuckDB in the browser. WebAssemply support and performance varies from browser to browser. For a smooth experience, we recommend using Chrome (or Chromium) to view this site.
:::

## Linked Interactions

Mosaic supports interaction across clients through reactive variables: _params_ and _selections_.
_Params_ represent single values that may be shared across components. When a param updates, clients that subscribe to that param will update in turn.

As in the [normalized stocks example](/examples/normalize) below, params can also be used in SQL expressions to create truly dynamic queries, with recalculation pushed to the database.
Upon each update, data is queried from a backing DuckDB instance—here running directly in the browser via WebAssembly.
_Move the cursor to see the return on investment if one had invested on a specific day._

<Example spec="/specs/yaml/normalize.yaml" />

_Selections_, on the other hand, represent filter criteria, just like a SQL `WHERE` clause.
A single Mosaic selection may combine predicates provided by a variety of diverse clients.
Mosaic selections can also synthesize ("resolve") different criteria for different clients, enabling complex coordination behaviors such as cross-filtering.

Below is an [interactive dashboard of Seattle weather data](/examples/weather).
_Drag in the top scatter plot to update a selection that filters the bar chart below. Click (or shift-click) either the color legend or the bar chart to populate a second selection that filters the scatter plot._

<Example spec="/specs/yaml/weather.yaml" />

## Queries & Optimization

Consider some time-series data with 50,000 sample points, visualized as an area chart. _Drag along the top overview chart to filter and zoom the focus chart below._

<Example spec="/specs/yaml/overview-detail.yaml" />

Interaction with the top chart populates a Mosaic _selection_ with the queried data range. Mosaic's _coordinator_ manages access to the database, handles selection updates, and also caches results.
But there's more: we don't need to draw all 50,000 points! After all, the chart itself is less than 700 pixels wide. [vgplot](/vgplot/), a Mosaic-based grammar of graphics, includes `area` and `line` marks that automatically apply optimizations to reduce the data to only a few sample points per-pixel, while preserving a perceptually faithful visualization.

Next let's visualize over 200,000 flight records. The first histogram shows flight arrival delays, the second shows hour of departure. Selecting intervals in one chart will cross-filter the other. _Try selecting highly delayed flights. Note how much more likely they are to leave later in the day._

<Example spec="/specs/yaml/crossfilter.yaml" />

When the selection changes we need to filter the data and recount the number of records in each bin. The Mosaic coordinator analyzes these queries and automatically optimizes updates by building indices of pre-aggregated data in the database, binned at the level of input pixels for the currently active view.

While 200,000 points will stress many web-based visualization tools, Mosaic doesn't break a sweat. Now go ahead and try this with [10 million records](/examples/flights-10m)!

## Putting the Pieces Together

The Mosaic project consists of a suite of packages:

- [`mosaic-core`](/core/):
  The core Mosaic components.
  A central coordinator, parameters and selections for linking values or query predicates (respectively) across Mosaic clients. The Mosaic coordinator can send queries over the network to a backing server (`socket` and `rest` clients) or to a client-side [DuckDB-WASM](https://duckdb.org/2021/10/29/duckdb-wasm.html) instance (`wasm` client). The binary [Apache Arrow](https://arrow.apache.org/) format is used for efficient data transfer.
- [`mosaic-sql`](/sql/):
  An API for convenient construction and analysis of SQL queries.
  Includes support for aggregate functions, window functions, and arbitrary expressions with dynamic parameters. Query objects coerce to SQL query strings.
- [`mosaic-duckdb`](/duckdb/):
  A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of Apache Arrow and JSON data over either Web Sockets or HTTP.
- [`mosaic-inputs`](/inputs/): Standalone data-driven components such as input menus, text search boxes, and sortable, load-on-scroll data tables.
- [`vgplot`](/vgplot/): A **v**isualization **g**rammar in which marks (plot layers) are individual Mosaic clients.
  Marks can push data processing (binning, filtering, aggregation, regression, ...) to the database and apply mark-specific optimizations (such as [M4](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization) for line/area charts).
  vgplot provides a JavaScript DSL and a declarative YAML/JSON format that combine marks, interactors, input widgets, and dashboard layout.
  Once data and parameters are marshalled, [Observable Plot](https://observablehq.com/plot) is used to render [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) output.
- [`widget`](/jupyter/):
  A Jupyter widget for Mosaic that renders vgplot specifications in Jupyter notebook cells, with data processing by DuckDB in the Python kernel.

## An Active Research Project

Mosaic is an active research project from the [UW Interactive Data Lab](https://idl.cs.washington.edu/), in collaboration with the [CMU Data Interaction Group](https://dig.cmu.edu/).
We are interested in unifying advances in scalable visualization methods with languages for interactive visualization.
This is an exciting area with a number of open challenges!

If you're interested in contributing, please see our [GitHub repository](https://github.com/uwdata/mosaic).
