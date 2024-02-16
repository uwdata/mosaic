<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Bias Parameter

Dynamically adjust queried values by adding a Param value. The SQL expression is re-computed in the database upon updates.

<Example spec="/specs/yaml/bias.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/bias.js [JavaScript]
<<< @/public/specs/yaml/bias.yaml [YAML]
<<< @/public/specs/json/bias.json [JSON]
:::
