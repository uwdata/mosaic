<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Bias Parameter

Dynamically adjust queried values by adding a Param value.
The expression is re-computed in the database upon updates.

<Example spec="/specs/yaml/bias.yaml" />

## Specification

::: code-group
<<< @/specs/esm/bias.js [JavaScript]
<<< @/specs/yaml/bias.yaml [YAML]
<<< @/specs/json/bias.json [JSON]
:::
