<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Symbol Plots

Two scatter plots with `dot` marks: one with stroked symbols, the other filled.

<Example spec="/specs/yaml/symbols.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/symbols.js [JavaScript]
<<< @/public/specs/yaml/symbols.yaml [YAML]
<<< @/public/specs/json/symbols.json [JSON]
:::
