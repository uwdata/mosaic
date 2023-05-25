<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Seattle Average Temperature

Historical monthly average temperatures in Seattle, WA.

<Example spec="/specs/yaml/seattle-temp.yaml" />

## Specification

::: code-group
<<< @/specs/esm/seattle-temp.js [JavaScript]
<<< @/specs/yaml/seattle-temp.yaml [YAML]
<<< @/specs/json/seattle-temp.json [JSON]
:::
