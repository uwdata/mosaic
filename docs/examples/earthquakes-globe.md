<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Earthquakes Globe

A rotatable globe of earthquake activity. To show land masses, this example loads and parses TopoJSON data in the database. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/earthquakes-globe.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-earthquake-globe).

## Specification

::: code-group
<<< @/public/specs/esm/earthquakes-globe.js [JavaScript]
<<< @/public/specs/yaml/earthquakes-globe.yaml [YAML]
<<< @/public/specs/json/earthquakes-globe.json [JSON]
<<< @/public/specs/python/earthquakes-globe.py [Python]
:::
