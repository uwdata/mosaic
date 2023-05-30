<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Seattle Average Temperature

Historical monthly average temperatures in Seattle, WA.

<Example spec="/specs/yaml/seattle-temp.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/seattle-temp.js [JavaScript]
<<< @/public/specs/yaml/seattle-temp.yaml [YAML]
<<< @/public/specs/json/seattle-temp.json [JSON]
:::
