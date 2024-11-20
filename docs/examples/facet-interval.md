<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Faceted Interval Selections

A faceted plot with 2D interval selections.

<Example spec="/specs/yaml/facet-interval.yaml" />

**Credit**: Adapted from https://observablehq.com/@observablehq/plot-non-faceted-marks

## Specification

::: code-group
<<< @/public/specs/esm/facet-interval.js [JavaScript]
<<< @/public/specs/yaml/facet-interval.yaml [YAML]
<<< @/public/specs/json/facet-interval.json [JSON]
:::
