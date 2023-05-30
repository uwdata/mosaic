<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Why Mosaic?

Though many expressive visualization tools exist, scalability to large datasets and interoperability across tools remain challenging.
The visualization community lacks open, standardized tools for integrating visualization specifications with scalable analytic databases.
While libraries like [D3](https://d3js.org) embrace Web standards for cross-tool interoperability, higher-level frameworks often make closed-world assumptions, complicating integration with other tools and environments.

## Mosaic is scalable

Visualization tools such as [ggplot2](https://ggplot2.tidyverse.org/), [Vega-Lite / Altair](https://vega.github.io/vega-lite/), and [Observable Plot](https://observablehq.com/plot/) support an expressive range of visualizations with a concise syntax.
However, these tools were not designed to handle millions of data points.
Mosaic provides greater scalability by pushing data-heavy computation to a backing [DuckDB](/duckdb/) database.
Mosaic improves performance further by caching results and, when possible, performing automatic query optimization.

![Data loading and static plot rendering performance.](/benchmarks-static.png)

The figure above shows render times for static plots over increasing dataset sizes.
Mosaic provides faster results, often by one or more orders of magnitude.
DuckDB-WASM in the browser fares well, though is limited (compared to a DuckDB server) by WebAssembly's lack of parallel processing.
[VegaFusion](https://vegafusion.io/) performs server-side optimization for _bars_ and _2D histograms_, but otherwise provided results identical to Vega-Lite.

However, it is with interaction that we believe Mosaic really shines!
For many forms of aggregated data, the coordinator can automatically pre-aggregate data, creating smaller backing tables that can be cached in-database and queried quickly to handle interactive updates. With this approach, we can support real-time interaction with billion+ element databases.
By default, Mosaic will prefetch index tables when the mouse cursor enters a view.
For very large data sets with longer index construction times, precomputation and server-side caching of indices is supported.

Meanwhile, other tasks, like changing a color encoding or adjusting a smoothing parameter, can be carried out quickly in the browser alone, including over aggregated data. Mosaic clients have the flexibility of choosing what works best.

## Mosaic is interoperable

Mosaic provides an open "middle-tier" architecture that manages data access and links clients (visualizations, input widgets, and more).
Using a shared architecture, a visualization grammar could readily interoperate with other libraries, including input components and other visualization tools.
We demonstrate this through the design of [_vgplot_](/vgplot/), a Mosaic-based grammar of interactive graphics that combines concepts from existing visualization tools.

Mosaic provides a generalized _selection_ abstraction inspired by [Vega-Lite](https://vega.github.io/vega-lite/).
Compared to Vega-Lite, Mosaic selections are decoupled from input event handling, support more complex resolution strategies, and offload computation to a backing scalable database.
Critically, any component that implements the Mosaic _client_ interface can both issue queries and be automatically filtered by a provided _selection_.


## Mosaic is extensible

Currently Mosaic includes a library of [input widgets](/vgplot/inputs.html) and [vgplot](/vgplot/), a prototype grammar of graphics.
Both provide components implemented as one or more Mosaic clients.
Mosaic can readily be extended with new clients, or, as in the case of vgplot, entire component libraries.
Possible future additions include network visualization tools, WebGL/WebGPU enabled clients for more scalable rendering, and more!
