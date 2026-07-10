<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Triangle Wave

A test specification to compare M4 optimized and unoptimized line charts.

<Example spec="/specs/yaml/triangle-wave.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/triangle-wave.js [JavaScript]
<<< @/public/specs/yaml/triangle-wave.yaml [YAML]
<<< @/public/specs/json/triangle-wave.json [JSON]
<<< @/public/specs/python/triangle-wave.py [Python]
:::
