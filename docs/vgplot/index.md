---
title: Mosaic vgplot
---

<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# vgplot: An Interactive Grammar of Graphics

A grammar of interactive graphics in which graphical marks are Mosaic clients.

<Example spec="/specs/yaml/mark-types.yaml" />

As the name suggests, `vgplot` combines concepts from existing tools such as Vega-Lite, ggplot2, and Observable Plot.
Like Vega-Lite, vgplot supports rich interactions and declarative specification either using an API or standalone JSON/YAML specs.
However, because vgplot is based on Mosaic, it easily interoperates with other Mosaic clients, such as [Mosaic Inputs](/inputs/).
Internally, vgplot uses Observable Plot to render SVG output.

This page provides an overview of vgplot.
Skip to the [examples](/examples/) to dive right in.

::: tip
For convenience, `vgplot` re-exports much of the `mosaic-core`, `mosaic-sql`, and `mosaic-inputs` packages. For most applications, it is sufficient to import `@uwdata/vgplot` alone.
:::

## Plots

A `plot` produces a single visualization as a Web element.
A `plot` is defined as a list of directives defining plot [attributes](#attributes), [marks](#marks), [interactors](#interactors), or [legends](#legends).

Similar to other grammars, a `plot` consists of _marks_&mdash;graphical primitives such as bars, areas, and lines&mdash;which serve as chart layers.
We use the semantics of Observable Plot, such that each `plot` has a dedicated set of encoding _channels_ with named _scale_ mappings such as `x`, `y`, `color`, `opacity`, etc.
Plots support faceting of the `x` and `y` dimensions, producing associated `fx` and `fy` scales.
Plots are rendered to SVG output by marshalling a specification and passing it to Observable Plot.

<Example spec="/specs/yaml/line.yaml" />

::: code-group
``` js [JavaScript]
import { plot, line, from, width, height } from "@uwdata/vgplot";
plot(
  line(from("aapl"), { x: "Date", y: "Close" }),
  width(680),
  height(200)
)
```
``` yaml [YAML]
plot:
- mark: line
  data: { from: aapl }
  x: Date
  y: Close
width: 680
height: 200
```
:::

The stock chart above consists of three directives:

1. A `line` mark to visualize data from a backing data table named `"aapl"`.
2. A `width` attribute to set the chart width in pixels.
3. A `height` attribute to set the chart height in pixels.

[Plot API Reference](/api/vgplot/plot)

## Attributes

_Attributes_ are plot-level settings such as `width`, `height`, margins, and scale options (e.g., `xDomain`, `colorRange`, `yTickFormat`). Attributes may be [`Param`](/core/#params)-valued, in which case a plot updates upon param changes.

vgplot includes a special `Fixed` scale domain setting (e.g., `xDomain(Fixed)`), which instructs a plot to first calculate a scale domain in a data-driven manner, but then keep that domain fixed across subsequent updates.
Fixed domains enable stable configurations without requiring a hard-wired domain to be known in advance, preventing disorienting scale domain "jumps" that hamper comparison across filter interactions.

[Attributes API Reference](/api/vgplot/attributes)

## Marks

_Marks_ are graphical primitives, often with accompanying data transforms, that serve as chart layers.
In vgplot, each mark is a Mosaic client that produces queries for needed data.
Marks accept a data source definition and a set of supported options, including encoding *channels* (such as `x`, `y`, `fill`, and `stroke`) that can encode data *fields*.

A data field may be a column reference or query expression, including dynamic param values.
Common expressions include aggregates (`count`, `sum`, `avg`, `median`, _etc._), window functions (such as [moving averages](/examples/moving-average)), date functions, and a `bin` transform.
Most field expressions&mdash;including aggregate, window, and date functions&mdash;are specified using [Mosaic SQL](/sql/) builder methods.

Marks support dual modes of operation: if an explicit array of data values is provided instead of a backing `from(tableName)` reference, vgplot will visualize that data without issuing any queries to the database. This functionality is particularly useful for adding manual annotations, such as custom rules or text labels.

[Marks API Reference](/api/vgplot/marks)

::: warning
Interactive filtering is not supported if you bypass the database and pass data directly to a mark.
:::

### Basic Marks

Basic marks, such as `dot`, `bar`, `rect`, `cell`, `text`, `tick`, and `rule`, mirror their namesakes in [Observable Plot](https://observablehq.com/plot/).
Variants such as `barX` and `rectY` indicate spatial orientation and data type assumptions. `barY` indicates vertical bars&mdash;continuous `y` over an ordinal `x` domain&mdash;whereas `rectY` indicates a continuous `x` domain.

Basic marks follow a straightforward query construction process:

- Iterate over all encoding channels to build a `SELECT` query.
- If no aggregates are encountered, query all fields directly.
- If aggregates are present, include non-aggregate fields as `GROUP BY` criteria.
- If provided, map filtering criteria to a SQL `WHERE` clause.

### Connected Marks

The `area` and `line` marks connect consecutive sample points.
Connected marks are treated similarly to basic marks, with one notable addition: the queries for spatially oriented marks (`areaY`, `lineX`) can apply [M4 optimization](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization). The query construction method uses plot width and data min/max information to determine the pixel resolution of the mark range. When the data points outnumber available pixels, M4 performs perceptually faithful pixel-aware binning of the series, limiting the number of drawn points. This optimization offers dramatic data reductions for both single and multiple series.

Separately, vgplot includes a `regressionY` mark for linear regression fits. Regression calculations and associated statistics are performed in-database in a single aggregate query. The mark then draws the regression line and optional confidence interval area.

### Density Marks

The `densityY` mark performs 1D kernel density estimation (KDE).
The `densityY` mark defaults to areas, but supports a `type` option to instead use lines, points, or other basic marks.
The generated query performs _linear binning_, an alternative to standard binning that proportionally distributes the weight of a point between adjacent bins to provide greater accuracy for density estimation. The query uses subqueries for the "left" and "right" bins, then aggregates the results. The query result is a 1D grid of binned values which are then smoothed. As smoothing is performed in the browser, interactive bandwidth updates are processed immediately.

The `density`, `contour`, and `raster` marks compute densities over a 2D domain using either linear (default) or standard binning. Smoothing again is performed in browser; setting the `bandwidth` option to zero disables smoothing. The `contour` mark then performs contour generation, whereas the `raster` mark generates a colored bitmap. Dynamic changes of bandwidth, contour thresholds, and color scales are handled immediately in browser.

The `hexbin` mark pushes hexagonal binning and aggregation to the database. Color and size channels may be mapped to `count` or other aggregates. Hexagon plotting symbols can be replaced by other basic marks (such as `text`) via the `type` option.

The `denseLine` mark creates a density map of line segments, rather than points.
Line density estimation is pushed to the database. To ensure that steep lines are not over-represented, we approximate arc-length normalization for each segment by normalizing by the number of filled raster cells on a per-column basis. We then aggregate the resulting weights for all series to produce the line densities.

## Interactors

_Interactors_ imbue plots with interactive behavior. Most interactors listen to input events from rendered plot SVG elements to update bound [_selections_](/core/#selections). Interactors take facets into account to properly handle input events across subplots.

The `toggle` interactor selects individual points (e.g., by click or shift-click) and generates a selection clause over specified fields of those points. Directives such as `toggleColor`, `toggleX`, and `toggleY` simplify specification of which channel fields are included in the resulting predicates.

The `nearestX` and `nearestY` interactors select the nearest value along the `x` or `y` encoding channel.

The `intervalX` and `intervalY` interactors create 1D interval brushes.
The `intervalXY` interactor creates a 2D brush.
Interval interactors accept a `pixelSize` parameter that sets the brush resolution: values may snap to a grid whose bins are larger than screen pixels and this can be leveraged to optimize query latency.

The `panZoom` interactor produces interval selections over corresponding `x` or `y` scale domains. Setting these selections to a plot's `xDomain` and/or `yDomain` attributes will cause the plot to pan and zoom in response.

The `highlight` interactor updates the rendered state of a visualization in response to a Selection.
Non-selected points are set to translucent, neutral gray, or other specified visual properties.
Selected points maintain normal encodings.
We perform highlighting by querying the database for a selection bit vector and then modifying the rendered SVG.

[Interactors API Reference](/api/vgplot/interactors)

## Legends

_Legends_ can be added to `plot` specifications or included as standalone elements.

The `name` directive gives a `plot` a unique name.
A standalone legend can reference a named plot (`colorLegend({ for: 'name' })`) to avoid respecifying scale domains and ranges.

Legends also act as interactors, taking a bound Selection as a parameter.
For example, discrete legends use the logic of the `toggle` interactor to enable point selections.
Two-way binding is supported for Selections using _single_ resolution, enabling legends and other interactors to share state.

[Legends API Reference](/api/vgplot/legends)

## Layout

Layout helpers combine elements such as [plots](#plots) and [inputs](/inputs/) into multi-view dashboard displays.
vgplot includes `vconcat` (vertical concatenation) and `hconcat` (horizontal concatenation) methods for multi-view layout.
These methods accept a list of elements and position them using CSS `flexbox` layout.
Layout helpers can be used with plots, inputs, and arbitrary Web content such as images and videos.
To ensure spacing, the `vspace` and `hspace` helpers add padding between elements in a layout.

[Layout API Reference](/api/vgplot/layout)
