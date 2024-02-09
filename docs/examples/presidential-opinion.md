<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Presidential Opinion

Opinion poll data on historical U.S. presidents. Image marks are used to show presidential pictures. The dropdown menu toggles the opinion metric shown.

<Example spec="/specs/yaml/presidential-opinion.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-image-medals).

## Specification

::: code-group
<<< @/public/specs/esm/presidential-opinion.js [JavaScript]
<<< @/public/specs/yaml/presidential-opinion.yaml [YAML]
<<< @/public/specs/json/presidential-opinion.json [JSON]
:::
