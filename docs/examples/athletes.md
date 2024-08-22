<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Olympic Athletes

An interactive dashboard of athlete statistics. The menus and searchbox filter the display and are automatically populated by backing data columns.

<Example spec="/specs/yaml/athletes.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/athletes.js [JavaScript]
<<< @/public/specs/yaml/athletes.yaml [YAML]
<<< @/public/specs/json/athletes.json [JSON]
:::
