<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Earthquakes Feed

Earthquake data from the USGS live feed. To show land masses, this example loads and parses TopoJSON data in the database. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/earthquakes-feed.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-live-earthquake-map).

## Specification

::: code-group
<<< @/public/specs/esm/earthquakes-feed.js [JavaScript]
<<< @/public/specs/yaml/earthquakes-feed.yaml [YAML]
<<< @/public/specs/json/earthquakes-feed.json [JSON]
:::
