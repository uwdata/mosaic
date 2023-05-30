<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Symbol Plots

Two scatter plots with `dot` marks: one with stroked symbols, the other filled.


<Example spec="/specs/yaml/symbols.yaml" />

## Specification

::: code-group
<<< @/specs/esm/symbols.js [JavaScript]
<<< @/specs/yaml/symbols.yaml [YAML]
<<< @/specs/json/symbols.json [JSON]
:::
