<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# U.S. States

A map of U.S. states overlaid with computed centroids. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/us-state-map.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-state-centroids).

## Specification

::: code-group
<<< @/public/specs/esm/us-state-map.js [JavaScript]
<<< @/public/specs/yaml/us-state-map.yaml [YAML]
<<< @/public/specs/json/us-state-map.json [JSON]
:::
