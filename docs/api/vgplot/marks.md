# Marks

Marks are graphical elements that visualize data through encoding _channels_ such as _x_ and _y_ position, _fill_ color, and _r_ (radius) size.
Marks are added to a [`Plot`](./plot) using the mark directive functions listed below.

Most mark functions take two arguments: a _data_ source and an _options_ object that specifies encoding channels or constant values.
To visualize data from a backing database, the `from()` method should be used to specify the data source. For example, `from("data", { filterBy: sel })` indicates that data should be drawn from the database table `"data"`, interactively filtered by the selection `sel`.

``` js
import { barY, from, plot } from "@uwdata/vgplot";
plot(
  barY(from("data"), { x: "a", y: "b", fill: "steelblue", opacity: 0.5 })
)
```

The example above specifies a bar chart with bars oriented vertically.
Data is drawn from the `"data"` table, with the column `"a"` mapped to an ordinal _x_ axis and the column `"b"` mapped to the _y_ axis.
The _fill_ option is the constant CSS color `"steelblue"` and the _opacity_ is a constant `0.5`.
For encoding channels, strings are interpreted as column names _unless_ they match a reserved constant for that key, such as a CSS color name for the _fill_ or _stroke_ options.

If an explicit array of data values is provided instead of a backing `from(tableName)` reference, vgplot will visualize that data without issuing any queries to the database. This functionality is particularly useful for adding manual annotations, such as custom rules or text labels.

Marks that only add reference lines or shapes (e.g., [`frame`](#frame), [`axisX`](#axis), [`gridY`](#grid), [`hexgrid`](#hexgrid), [`graticule`](#geo), [`sphere`](#geo)) do not require corresponding data, and take only _options_.

Marks use the semantics of [Observable Plot](https://observablehq.com/plot/features/marks).
For example, mark variants may indicate not only shapes but also data type assumptions.
The [`barY`](#bar) mark above assumes a discrete (ordinal) _x_ axis and will produce a `band` scale, whereas the related [`rectY`](#rect) mark instead assumes a continuous _x_ axis and by default will produce a `linear` scale.

## Area

An `area` mark, with `areaX` and `areaY` variants.
When feasible, the `areaX` and `areaY` marks will perform [M4 optimization](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization) to limit the number of sample points returned from the database.
Use `from("data", { optimize: false })` to disable this behavior.
For supported options, see the [Observable Plot `area` documentation](https://observablehq.com/plot/marks/area).

## Arrow

The `arrow` mark provides line segments with arrow heads.
For supported options, see the [Observable Plot `arrow` documentation](https://observablehq.com/plot/marks/arrow).

## Axis

To go beyond the built-in axis generation, the axis mark supports explicit inclusion of axes, along with control over drawing order.
The provided mark directives are `axisX` and `axisY` (for standard axes) as well as `axisFx` and `axisFy` (for facet axes).
For supported options, see the [Observable Plot `axis` documentation](https://observablehq.com/plot/marks/axis).

## Bar

The `barX` and `barY` marks draw rectangles, and should be used when one dimension is ordinal and the other is quantitative.
For supported options, see the [Observable Plot `bar` documentation](https://observablehq.com/plot/marks/bar).

## Cell

The `cell` mark, with `cellX` and `cellY` variants, draws rectangles positioned in two ordinal dimensions.
For supported options, see the [Observable Plot `cell` documentation](https://observablehq.com/plot/marks/cell).

## Contour

The `contour` mark draws isolines to delineate regions above and below a particular continuous value.
It is often used to convey densities as a height field.
The special column name `"density"` can be used to map density values to the _fill_ or _stroke_ options.

The supported _options_ are:

- _x_: The x dimension encoding channel
- _y_: The y dimension encoding channel
- _fill_: The contour fill color
- _stroke_: The contour stroke color
- _thresholds_: The number of contour thresholds to include (default `10`)
- _bandwidth_: The kernel density bandwidth for smoothing, in pixels (default `20`)
- _interpolate_: The binning interpolation method to use, one of `"linear"` (default) or `"none"`
- _pixelSize_: The grid cell size in screen pixels (default `2`); ignored when _width_ and _height_ options are provided
- _width_: The number of grid bins to include along the _x_ dimension
- _height_: The number of grid bins to include along the _y_ dimension
- _pad_: The bin padding, one of `0` (default) to make the bins flush with the maximum domain value, or `1` to include extra padding for the final bin
- Other standard mark options including _fillOpacity_ and _strokeWidth_

## Delaunay

Given set of points in x and y, the Delaunay marks compute the Delaunay triangulation, its dual the Voronoi tessellation, and the convex hull.
The supported marks are `voronoi`, `voronoiMesh`, `delaunayLink`, `delaunayMesh`, and `hull`.
For more, see the [Observable Plot `delaunay` documentation](https://observablehq.com/plot/marks/delaunay).

## Density 1D

The 1D density marks show smoothed point cloud densities along one dimension.
The `densityX` and `densityY` marks bin the data, count the number of records that fall into each bin, smooth the resulting counts, then plot the smoothed distribution (by default using an `area` mark).
The `densityX` mark maps density values to the _x_ dimension automatically, while `densityY` maps the density values to the _y_ dimension.

The supported _options_ are:

- _x_: The x dimension encoding channel, used with `densityY`
- _y_: The y dimension encoding channel, used with `densityX`
- _type_: The mark type to use (default [`areaX`](#area) or [`areaY`](#area))
- _bins_: The number of bins (default `1024`)
- _bandwidth_: The kernel density bandwidth for smoothing, in pixels (default `20`)
- Any options accepted by the mark _type_, including _stroke_ and _fill_

## Density 2D

The 2D `density` mark shows smoothed point cloud densities along two dimensions.
The mark will bin the data, count the number of records that fall into each bin, smooth the resulting counts, then plot the smoothed distribution (by default using a circular `dot` mark).
The `density` mark calculates density values that can be mapped to encoding channels such as _fill_ or _r_ using the column name `"density"`.

The supported _options_ are:

- _x_: The x dimension encoding channel
- _y_: The y dimension encoding channel
- _type_: The mark type to use (default [`dot`](#dot))
- _bandwidth_: The kernel density bandwidth for smoothing, in pixels (default `20`)
- _interpolate_: The binning interpolation method to use, one of `"linear"` (default) or `"none"`
- _pixelSize_: The grid cell size in screen pixels (default `2`); ignored when _width_ and _height_ options are provided
- _width_: The number of grid bins to include along the _x_ dimension
- _height_: The number of grid bins to include along the _y_ dimension
- _pad_: The bin padding, one of `0` (default) to make the bins flush with the maximum domain value, or `1` to include extra padding for the final bin
- Any options accepted by the mark _type_, including _fill_, _stroke_, and _r_

## Dense Line

Rather than plot point densities, the `denseLine` mark plots line densities: the mark forms a binned raster grid and "draws" lines into it.
To avoid over-weighting steep lines, by default each drawn series will be normalized on a per-column basis to approximate arc length normalization.
The values for each series are then aggregated to form the line density, which is then drawn as an image similar to the [`raster`](#raster) mark.

The supported _options_ are:

- _x_: The x dimension encoding channel
- _y_: The y dimension encoding channel
- _bandwidth_: The kernel density bandwidth for smoothing (default `0`)
- _pixelSize_: The grid cell size in screen pixels (default `1`)
- _pad_: The bin padding, one of `1` (default) to include extra padding for the final bin, or `0` to make the bins flush with the maximum domain value.
- _width_: The number of grid bins to include along the _x_ dimension
- _height_: The number of grid bins to include along the _y_ dimension
- _normalize_: Boolean flag (default `true`) controlling approximate arc length normalization.

## Dot

The `dot` mark, with `dotX` and `dotY` variants, draws circles or other symbols positioned in _x_ and _y_ as in a scatterplot.
The `circle` and `hexagon` marks are convenient shorthands for specific shapes.
For supported options, see the [Observable Plot `dot` documentation](https://observablehq.com/plot/marks/dot).

## Frame

The `frame` mark draws a rectangle around the plot area.
It does not take a _data_ argument.
For supported options, see the [Observable Plot `frame` documentation](https://observablehq.com/plot/marks/frame).

## Geo

The `geo` mark draws geographic features—polygons, lines, points, and other geometry—often as thematic maps.
Input data can be provided directly an array of GeoJSON features or geographic data can be loaded and queried directly in DuckDB using the `spatial` extension.

The _geometry_ option indicates the column name containing GeoJSON features or GeoJSON geometry objects.
If _geometry_ is not specified, the mark will interpret input objects as GeoJSON when data is passed in directly.
When querying geometry from a DuckDB table, the _geometry_ option will default to `'geom'` (the default name for geometry data loaded using the `spatial` extension's `ST_Read` function) and will be automatically converted to GeoJSON format in the databse using the `ST_asGeoJSON` function.
If the _geometry_ option is specified, automatic conversion of DuckDB query results is _not_ performed; this enables more fine-grained control, but may require explicit conversion of data to GeoJSON format using `ST_asGeoJSON` (or equivalently using Mosaic's `geojson()` SQL helper).

The `sphere` and `graticule` marks (which do not accept input data) include the sphere of the Earth and global reference lines, respectively.
For other supported options, see the [Observable Plot `geo` documentation](https://observablehq.com/plot/marks/geo).

## Grid

The grid mark is a specially-configured rule for drawing an axis-aligned grid.
To go beyond the built-in axis generation, the grid mark supports explicit inclusion of grid lines, along with control over drawing order.
The provided mark directives are `gridX` and `gridY` (for standard axes) as well as `gridFx` and `gridFy` (for facet axes).
For supported options, see the [Observable Plot `grid` documentation](https://observablehq.com/plot/marks/grid).

## Heatmap

The `heatmap` mark is a raster mark with default options for accurate density estimation via smoothing.
The _bandwidth_ (`20`), _interpolate_ (`"linear"`), and _pixelSize_ (`2`) options are set to produce smoothed density heatmaps.
For all supported options, see the [`raster`](#raster) mark.

## Hexbin

The `hexbin` mark bins data into a hexagonal grid and visualizes aggregate functions per bin (e.g., `count` for binned density).
Hexagonal binning and aggregation are pushed to the backing database.
Aggregate functions can be used for the mark _fill_, _stroke_, or radius size _r_ options.

The supported _options_ are:

- _x_: The x dimension encoding channel
- _y_: The y dimension encoding channel
- _type_: The mark type to use (default [`hexagon`](#dot))
- _binWidth_: The hexagon bin width in screen pixels (default `20`)
- Any options accepted by the mark _type_, including _fill_, _stroke_, _r_.

## Hexgrid

The `hexgrid` mark draws a hexagonal grid spanning the frame.
For supported options, see the [Observable Plot `hexgrid` documentation](https://observablehq.com/plot/marks/hexgrid).

## Image

The `image` mark draws images centered at the given position in _x_ and _y_.
For supported options, see the [Observable Plot `image` documentation](https://observablehq.com/plot/marks/image).

## Line

A `line` mark, with `lineX` and `lineY` variants.
When feasible, the `lineX` and `lineY` marks will perform [M4 optimization](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization) to limit the number of sample points returned from the database.
Use `from("data", { optimize: false })` to disable this behavior.
For supported options, see the [Observable Plot `line` documentation](https://observablehq.com/plot/marks/line).

## Regression

The `regressionY` mark draws a regression line and optional confidence interval area for a linear regression fit.
The regression calculation is pushed to the backing database.

The supported _options_ are:

- _x_: The x dimension (predictor) encoding channel
- _y_: The y dimension (predicted) encoding channel
- _ci_: The confidence level (default `0.95`) to visualize as a confidence band area; use zero or `null` to suppress
- _precision_: The distance (in pixels) between samples of the confidence band (default `4`)

## Link

The `link` mark draws straight lines between two points [_x1_, _y1_] and [_x2_, _y2_] in quantitative dimensions.
For supported options, see the [Observable Plot `link` documentation](https://observablehq.com/plot/marks/link).

## Raster

The `raster` mark draws an image whose pixel colors are a function of the underlying data.
The _x_ and _y_ data domains are binned into the cells ("pixels") of a raster grid, typically with an aggregate function evaluated over the binned data.
The result can be optionally smoothed (blurred) in-browser.
To create a smoothed density heatmap, use the [`heatmap`](#heatmap) mark; this is a raster mark with different default options.

The supported _options_ are:

- _x_: The x dimension encoding channel
- _y_: The y dimension encoding channel
- _fill_: The pixel fill color. Use the special value `"density"` to map computed density values to pixel colors. Use an aggregate expression to instead visualize an aggregate value per raster bin. If _fill_ is set to a constant color or to a non-aggregate field, opacity will be used to convey densities. If a non-aggregate (group by) field is provided, multiple rasters are created with a unique categorical color per layer.
- _fillOpacity_: The pixel fill opacity. Use the special value `"density"` to map computed density values to opacity. Use an aggregate expression to instead visualize an aggregate value per raster bin.
- _weight_: A data column by which to weight computed densities
- _bandwidth_: The kernel density bandwidth for smoothing, in pixels (default `0`)
- _interpolate_: The binning interpolation method to use. The `"none"` and `"linear"` methods are performed in-database and only fill bins corresponding to observed data samples. The other methods are performed in-browser and interpolate to fill all raster pixels. The options are:
  - `"none"` (default): Map data samples to single bins only.
  - `"linear"`: Linearly distribute the "weight" of a sample across adjacent bin boundaries. Linear binning provides more stable and accurate density estimation upon subsequent smoothing.
  - `"nearest"`: Perform nearest-neighbor interpolation, forming a pixel-level Voronoi diagram.
  - `"barycentric"`: Interpolate over a triangulation of sample points. Pixels outside the convex hull of data samples are extrapolated.
  - `"random-walk`: Apply a random walk from empty pixels until a sample is found.
- _pixelSize_: The grid cell size in screen pixels (default `1`); ignored when _width_ and _height_ options are provided
- _width_: The number of grid bins to include along the _x_ dimension
- _height_: The number of grid bins to include along the _y_ dimension
- _pad_: The bin padding, one of `1` (default) to include extra padding for the final bin, or `0` to make the bins flush with the maximum domain value

## Rect

The `rect` mark, with `rectX` and `rectY` variants, draws draws axis-aligned rectangles defined by _x1_, _y1_, _x2_, and _y2_.
For supported options, see the [Observable Plot `rect` documentation](https://observablehq.com/plot/marks/rect).

## Rule

The `ruleX` mark draws a vertical line with a given _x_ value, while the `ruleY` mark draws a horizontal line with a given _y_ value.
For supported options, see the [Observable Plot `rule` documentation](https://observablehq.com/plot/marks/rule).

## Text

The `text` mark, with `textX` and `textY` variants, draws text at the given position in _x_ and _y_. It is often used to label other marks.
For supported options, see the [Observable Plot `text` documentation](https://observablehq.com/plot/marks/text).

## Tick

The `tickX` draws a vertical line with a given _x_ value, while the `tickY` mark draws a horizontal line with a given _y_ value.
Ticks have an optional secondary position dimension (_y_ for `tickX` and _x_ for `tickY`); this second dimension is ordinal, unlike a [`rule`](#rule), and requires a corresponding band scale.
For supported options, see the [Observable Plot `tick` documentation](https://observablehq.com/plot/marks/tick).

## Vector

The `vector` mark, with `vectorX` and `vectorY` variants, draws little arrows, typically positioned in _x_ and _y_ quantitative dimensions, with an optional magnitude (`length`) and direction (`rotate`), as in a vector field.

The `spike` mark is equivalent to `vector`, but changes the default `shape`, `anchor`, and color options to draw a more spiky element.

For supported options, see the [Observable Plot `vector` documentation](https://observablehq.com/plot/marks/vector).
