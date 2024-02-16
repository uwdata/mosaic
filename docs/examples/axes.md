<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Axes & Gridlines

Customized axis and gridline marks can be used in addition to standard scale attributes such as `xAxis`, `yGrid`, etc. Just add data!

<Example spec="/specs/yaml/axes.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/axes.js [JavaScript]
<<< @/public/specs/yaml/axes.yaml [YAML]
<<< @/public/specs/json/axes.json [JSON]
:::
