<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Axes & Gridlines

Customized axis and gridline marks can be used in addition to standard
scale attributes such as `xAxis`, `yGrid`, etc. Just add data!

<Example spec="/specs/yaml/axes.yaml" />

## Specification

::: code-group
<<< @/specs/esm/axes.js [JavaScript]
<<< @/specs/yaml/axes.yaml [YAML]
<<< @/specs/json/axes.json [JSON]
:::
