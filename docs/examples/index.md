# Examples

Mosaic-powered visualizations created with [vgplot](/vgplot/).
These visualizations can be specified using a JavaScript API, or in a standalone YAML or JSON file. Each example includes code for all three specification formats.

For example, here is a line chart of historical Apple stock prices:

<Example spec="/specs/yaml/line.yaml" />

::: code-group
<<< @/public/specs/esm/line.js [JavaScript]
<<< @/public/specs/yaml/line.yaml [YAML]
<<< @/public/specs/json/line.json [JSON]
:::

::: warning
By default Mosaic connects to a DuckDB server. To use a different database connector (such as DuckDB-WASM in the browser), you must first configure the connector. For example:

``` js
import { coordinator, wasmConnector } from "@uwdata/vgplot";
coordinator().databaseConnector(await wasmConnector());
```
:::

::: tip
For greater scalability and performance, consider using a local [DuckDB data server](/duckdb/) or viewing examples in [Jupyter](/jupyter/).
:::
