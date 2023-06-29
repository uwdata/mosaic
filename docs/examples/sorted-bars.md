<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Sorted Bars

Sort and limit an aggregate bar chart of gold medals by country.

<Example spec="/specs/yaml/sorted-bars.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/sorted-bars.js [JavaScript]
<<< @/public/specs/yaml/sorted-bars.yaml [YAML]
<<< @/public/specs/json/sorted-bars.json [JSON]
:::
