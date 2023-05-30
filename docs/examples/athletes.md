<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Olympic Athletes

An interactive dashboard of athlete statistics.
The input menus and searchbox filter the display and are automatically populated by backing data columns.

<Example spec="/specs/yaml/athletes.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/athletes.js [JavaScript]
<<< @/public/specs/yaml/athletes.yaml [YAML]
<<< @/public/specs/json/athletes.json [JSON]
:::
