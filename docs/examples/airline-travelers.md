<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Airline Travelers

A labeled line chart comparing airport travelers in 2019 and 2020.

<Example spec="/specs/yaml/airline-travelers.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-labeled-line-chart).

## Specification

::: code-group
<<< @/public/specs/esm/airline-travelers.js [JavaScript]
<<< @/public/specs/yaml/airline-travelers.yaml [YAML]
<<< @/public/specs/json/airline-travelers.json [JSON]
:::
