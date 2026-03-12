<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Legends

Tests for different legend types and configurations. We test both legends defined within plots (with a zero-size frame) and external legends that reference a named plot.

<Example spec="/specs/yaml/legends.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/legends.js [JavaScript]
<<< @/public/specs/yaml/legends.yaml [YAML]
<<< @/public/specs/json/legends.json [JSON]
<<< @/public/specs/python/legends.py [Python]
:::
