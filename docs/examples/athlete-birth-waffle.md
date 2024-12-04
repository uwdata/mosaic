<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Athlete Birth Waffle

Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.

<Example spec="/specs/yaml/athlete-birth-waffle.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit).

## Specification

::: code-group
<<< @/public/specs/esm/athlete-birth-waffle.js [JavaScript]
<<< @/public/specs/yaml/athlete-birth-waffle.yaml [YAML]
<<< @/public/specs/json/athlete-birth-waffle.json [JSON]
:::
