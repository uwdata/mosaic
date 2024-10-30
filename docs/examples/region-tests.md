<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Region Interactor Tests

<Example spec="/specs/yaml/region-tests.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/region-tests.js [JavaScript]
<<< @/public/specs/yaml/region-tests.yaml [YAML]
<<< @/public/specs/json/region-tests.json [JSON]
:::
