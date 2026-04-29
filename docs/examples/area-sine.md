<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Area Sine Wave

A test specification to compare M4 optimized and unoptimized area charts over a dense dual-tone sine wave.

<Example spec="/specs/yaml/area-sine.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/area-sine.js [JavaScript]
<<< @/public/specs/yaml/area-sine.yaml [YAML]
<<< @/public/specs/json/area-sine.json [JSON]
<<< @/public/specs/python/area-sine.py [Python]
:::
