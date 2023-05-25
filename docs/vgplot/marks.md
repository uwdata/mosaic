<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Marks

<Example spec="/specs/yaml/mark-types.yaml" />

Marks are graphical primitives, often with accompanying data transforms, that serve as chart layers.
In vgplot, each mark is a Mosaic client that produces queries for needed data.
Marks accept a data source definition and a set of supported options, including encoding *channels* (such as `x`, `y`, `fill`, and `stroke`) that can encode data *fields*.

A data field may be a column reference or query expression, including dynamic _Param_ values.
Common expressions include aggregates (`count`, `sum`, `avg`, `median`, etc.), window functions (e.g., rolling averages), date functions, and a `bin` transform.
Most field expressions&mdash;including aggregate, window, and date functions&mdash;are specified using [Mosaic SQL](/sql/) builder methods.

Marks support dual modes of operation: if an explicit array of data values is provided instead of a backing table reference, vgplot will visualize that data without issuing any queries to the database. This functionality is particularly useful for adding manual annotations, such as custom rules or text labels.

::: warning
Interactive filtering is not supported if you bypass the database and pass data directly to a mark.
:::

## Basic Marks

Basic marks, such as `dot`, `bar`, `rect`, `cell`, `text`, `tick`, and `rule`, mirror their namesakes in [Observable Plot](https://observablehq.com/plot/).
Variants such as `barX` and `rectY` indicate spatial orientation and explicit data type assumptions. For example, `barY` indicates vertical bars&mdash;continuous `y` over an ordinal `x` domain&mdash;whereas `rectY` indicates a continuous `x` domain.

Basic marks follow a straightforward query construction process:

- Iterate over all encoding channels to build a `SELECT` query.
- If no aggregates are encountered, query all fields directly.
- If aggregates are present, include non-aggregate fields as `GROUP BY` criteria.
- If provided, map filtering criteria to a SQL `WHERE` clause.


## Connected Marks

The `area` and `line` marks connect consecutive sample points.
Connected marks are treated similarly to basic marks, with one notable addition: the queries for spatially oriented marks (`areaY`, `lineX`) can apply [M4 optimization](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization). The query construction method uses plot width and data min/max information to determine the pixel resolution of the mark range. When the data points outnumber available pixels, M4 performs perceptually faithful pixel-aware binning of the series, limiting the number of drawn points. This optimization offers dramatic data reductions for both single and multiple series.

Separately, vgplot includes a `regression` mark for linear regression fits. Regression calculations and associated statistics are performed in-database in a single aggregate query. The mark then draws the regression line and optional confidence interval area.

## Density Marks

The `densityY` mark performs 1D kernel density estimation (KDE).
The `density` mark defaults to areas, but supports a `type` option to instead use lines, points, or other basic marks.
By default the generated query performs _linear binning_, an alternative to standard binning that proportionally distributes the weight of a point between adjacent bins to provide greater accuracy for density estimation. The query uses subqueries for the "left" and "right" bins, then aggregates the results. The query result is a 1D grid of binned values which are then smoothed. As smoothing is performed in the browser, interactive bandwidth updates are processed immediately.

The `density2D`, `contour`, and `raster` marks compute densities over a 2D domain using either linear (default) or standard binning. Smoothing again is performed in browser; setting the `bandwidth` option to zero disables smoothing. The `contour` mark then performs contour generation, whereas the `raster` mark generates a colored bitmap. Dynamic changes of bandwidth, contour thresholds, and color scales are handled immediately in browser.

The `hexbin` mark pushes hexagonal binning and aggregation to the database. Color and size channels may be mapped to `count` or other aggregates. Hexagon plotting symbols can be replaced by other basic marks (such as `text`) via the `type` option.

The `denseLine` mark creates a density map of line segments, rather than points.
Line density estimation is pushed to the database using a SQL query with multiple common table expressions (CTEs). First a window query is performed to bin and group line segment end points. Next, we perform line rasterization in database by joining against a set of pixel index positions. To ensure that steep lines are not over-represented, we approximate arc-length normalization for each segment by normalizing by the number of filled raster cells on a per-column basis. Finally we aggregate the resulting weights for all series to produce the line densities.
