<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Wind Map

`vector` marks on a grid show both direction and intensity—here, the speed of winds.
Expressions for `rotate`, `length`, and `stroke` values are evaluated in the database.


<Example spec="/specs/yaml/wind-map.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-wind-map).

## Specification

::: code-group
<<< @/specs/esm/wind-map.js [JavaScript]
<<< @/specs/yaml/wind-map.yaml [YAML]
<<< @/specs/json/wind-map.json [JSON]
:::
