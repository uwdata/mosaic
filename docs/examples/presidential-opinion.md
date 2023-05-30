<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Presidential Opinion

Opinion poll data on historical U.S. presidents.
Image marks are used to show presidential pictures.
The dropdown menu toggles the opinion metric shown.

<Example spec="/specs/yaml/presidential-opinion.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-image-medals).

## Specification

::: code-group
<<< @/specs/esm/presidential-opinion.js [JavaScript]
<<< @/specs/yaml/presidential-opinion.yaml [YAML]
<<< @/specs/json/presidential-opinion.json [JSON]
:::
