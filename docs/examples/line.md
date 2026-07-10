<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# line

<Example spec="/specs/yaml/line.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/line.js [JavaScript]
<<< @/public/specs/yaml/line.yaml [YAML]
<<< @/public/specs/json/line.json [JSON]
<<< @/public/specs/python/line.py [Python]
:::
