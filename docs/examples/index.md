# Examples

Example Mosaic-powered visualizations created with [vgplot](/vgplot/).

These examples use DuckDB-WASM as the backing database, running in-browser.
For greater scalability, consider using a local [DuckDB data server](/duckdb/) or viewing examples in [Jupyter](/jupyter/).
We recommend viewing examples in Chrome for better WebAssembly and image rendering performance.

Here is a chart visualizing the range of historical average minimum and maximum daily temperatures in Seattle, WA:

<Example spec="/specs/yaml/seattle-temp.yaml" />

[vgplot](/vgplot/) visualizations can be specified using a JavaScript API, or in a standalone YAML or JSON file. Each example includes code for all of these specification formats:

::: code-group
<<< @/specs/esm/seattle-temp.js [JavaScript]
<<< @/specs/yaml/seattle-temp.yaml [YAML]
<<< @/specs/json/seattle-temp.json [JSON]
:::
