<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# U.S. Unemployment

A choropleth map of unemployment rates for U.S. counties. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/unemployment.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-us-choropleth).

## Specification

::: code-group
<<< @/public/specs/esm/unemployment.js [JavaScript]
<<< @/public/specs/yaml/unemployment.yaml [YAML]
<<< @/public/specs/json/unemployment.json [JSON]
:::
