<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Walmart Openings

Maps showing Walmart store openings per decade. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/walmart.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-map-large-multiples).

## Specification

::: code-group
<<< @/public/specs/esm/walmart.js [JavaScript]
<<< @/public/specs/yaml/walmart.yaml [YAML]
<<< @/public/specs/json/walmart.json [JSON]
:::
