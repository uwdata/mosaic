# vgplotr: Interactive Visualizations with Mosaic and DuckDB

An R package for creating interactive, database-driven visualizations using the [Mosaic](https://github.com/uwdata/mosaic) framework. Create visualizations with a grammar of graphics inspired by ggplot2 and Vega-Lite, powered by DuckDB for scalable data processing.

## Features

- 🎨 **Grammar of Graphics**: Familiar, composable API inspired by ggplot2
- ⚡ **DuckDB Integration**: Process millions/billions of rows efficiently using DuckDB WASM
- 🔗 **Interactive Linking**: Crossfilter selections across multiple charts
- 📊 **Rich Visualizations**: 30+ mark types including bars, lines, areas, dots, maps, heatmaps
- 📄 **Quarto & RMarkdown**: Works seamlessly in Quarto documents and RMarkdown
- ✨ **Shiny Ready**: Full support for Shiny applications

## Installation

```r
# Install from GitHub (not yet on CRAN)
# remotes::install_github("uwdata/mosaic", subdir = "packages/vgplot/vgplotr")

# After cloning the repo, build the JavaScript bundle:
# cd packages/vgplot/vgplotr
# npm install
# npm run build

# Then install the R package:
# R CMD INSTALL .
```

## Quick Start

### Simple Histogram

```r
library(vgplotr)

# Create a histogram of mtcars mpg
spec <- mosaic_spec(
  plot(
    rectY(
      from("mtcars"),
      list(x = bin("mpg"), y = count(), fill = "steelblue")
    ),
    width = 600,
    height = 400
  )
)

vgplot(spec)
```

### Interactive Linked Histograms

```r
library(vgplotr)

# Create crossfilter selection for linking
brush <- Selection$crossfilter()

# Helper to create a filtered histogram with brushing
make_plot <- function(column) {
  plot(
    rectY(
      from("mtcars", filterBy = brush),
      list(x = bin(column), y = count(), fill = "steelblue", inset = 0.5)
    ),
    intervalX(as = brush),
    xDomain(Fixed),
    marginLeft = 75,
    width = 600,
    height = 200
  )
}

# Create three linked histograms
spec <- mosaic_spec(
  vconcat(
    make_plot("mpg"),
    make_plot("hp"),
    make_plot("wt")
  )
)

vgplot(spec)
```

### Loading Data from URLs

DuckDB can directly query Parquet, CSV, and other files from URLs:

```r
library(vgplotr)

# Load and visualize data from a remote Parquet file
brush <- Selection$crossfilter()

make_plot <- function(column) {
  plot(
    rectY(
      from("flights10m", filterBy = brush),
      list(x = bin(column), y = count(), fill = "steelblue", inset = 0.5)
    ),
    intervalX(as = brush),
    xDomain(Fixed),
    width = 600,
    height = 200
  )
}

spec <- mosaic_spec(
  # SQL to load data
  list(
    type = "exec",
    sql = "CREATE TABLE IF NOT EXISTS flights10m AS
      SELECT
        GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay,
        DISTANCE AS distance,
        DEP_TIME AS time
      FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/flights-10m.parquet'"
  ),
  # Visualization
  vconcat(
    make_plot("delay"),
    make_plot("time"),
    make_plot("distance")
  )
)

vgplot(spec)
```

## Use in Quarto

In a Quarto document (`.qmd`):

````markdown
---
title: "Interactive Visualizations with vgplotr"
format: html
---

```{r}
library(vgplotr)

brush <- Selection$crossfilter()

make_plot <- function(column) {
  plot(
    rectY(
      from("mtcars", filterBy = brush),
      list(x = bin(column), y = count(), fill = "steelblue", inset = 0.5)
    ),
    intervalX(as = brush),
    xDomain(Fixed),
    width = 600,
    height = 200
  )
}

spec <- mosaic_spec(
  vconcat(
    make_plot("mpg"),
    make_plot("hp"),
    make_plot("wt")
  )
)

vgplot(spec)
```
````

## API Overview

### Core Functions

- `vgplot()`: Render a Mosaic specification as an htmlwidget
- `mosaic_spec()`: Create a Mosaic specification from elements
- `coordinator()`: Access the Mosaic coordinator

### Data & Selections

- `from(table, filterBy)`: Specify a data source
- `Selection$crossfilter()`: Create a crossfilter selection
- `Selection$single()`: Create a single-value selection
- `Selection$intersect()`: Create an intersection selection
- `Selection$union()`: Create a union selection

### Marks

- `rectY()`: Rectangular bars (histograms, bar charts)
- More marks coming soon: `dot()`, `line()`, `area()`, `barX()`, etc.

### Channels & Aggregations

- `bin(column)`: Bin a continuous variable
- `count()`: Count aggregation
- `distinct(column)`: Count distinct values
- `desc(column)`: Descending sort order

### Interactors

- `intervalX(as)`: X-axis interval brush
- `intervalY(as)`: Y-axis interval brush
- `intervalXY(as)`: 2D interval brush

### Layouts

- `plot(...)`: Create a plot with marks and interactors
- `vconcat(...)`: Vertical concatenation
- `hconcat(...)`: Horizontal concatenation

### Options

- `xDomain(domain)`: Set x-axis domain
- `yDomain(domain)`: Set y-axis domain
- `Fixed`: Constant for fixed domains

## Architecture

The package uses:

- **DuckDB WASM**: Runs DuckDB entirely in the browser for client-side data processing
- **Mosaic Core**: Coordinates selections and reactive updates across visualizations
- **Mosaic Spec**: Parses declarative specifications and instantiates visualizations
- **Observable Plot**: Renders SVG visualizations

This architecture enables:

1. **Self-contained outputs**: Quarto documents render to standalone HTML
2. **Scalability**: DuckDB can process millions/billions of rows
3. **Interactivity**: Crossfilter selections update multiple charts reactively
4. **URL data loading**: Load Parquet/CSV files directly from URLs

## Comparison to Other Packages

| Feature | vgplotr | plotly | echarts4r | ggplot2 |
|---------|---------|--------|-----------|---------|
| Interactive | ✅ | ✅ | ✅ | ❌ |
| Grammar of Graphics | ✅ | ⚠️ | ⚠️ | ✅ |
| DuckDB Integration | ✅ | ❌ | ❌ | ❌ |
| Linked Brushing | ✅ | ⚠️ | ⚠️ | ❌ |
| Large Data (>1M rows) | ✅ | ❌ | ❌ | ⚠️ |
| Load from URLs | ✅ | ❌ | ❌ | ❌ |

## Development

```bash
# Install dependencies
npm install

# Build JavaScript bundle
npm run build

# Watch for changes
npm run dev

# Install R package
R CMD INSTALL .
```

## License

BSD-3-Clause

## Citation

```bibtex
@misc{mosaic,
  title = {Mosaic: An Architecture for Scalable \& Interoperable Data Views},
  author = {Dominik Moritz and Jeffrey Heer},
  year = {2024},
  url = {https://github.com/uwdata/mosaic}
}
```

## Related Projects

- [Mosaic](https://github.com/uwdata/mosaic): The core JavaScript framework
- [mosaic-widget](https://pypi.org/project/mosaic-widget/): Python Jupyter widget
- [DuckDB](https://duckdb.org/): Embedded analytical database
- [Observable Plot](https://observablehq.com/plot/): JavaScript visualization library
