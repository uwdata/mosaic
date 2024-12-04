<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Symbol Plots

Two scatter plots with `dot` marks: one with stroked symbols, the other filled. Drop-down menus control which data table columns are plotted.

<Example spec="/specs/yaml/symbols.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/symbols.js [JavaScript]
<<< @/public/specs/yaml/symbols.yaml [YAML]
<<< @/public/specs/json/symbols.json [JSON]
:::
