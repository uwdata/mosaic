<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# U.S. Counties

A map of U.S. counties. County name tooltips are anchored to invisible centroid dot marks. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/us-county-map.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/us-county-map.js [JavaScript]
<<< @/public/specs/yaml/us-county-map.yaml [YAML]
<<< @/public/specs/json/us-county-map.json [JSON]
<<< @/public/specs/python/us-county-map.py [Python]
:::
