<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Population Change Arrows

An `arrow` connects the positions in 1980 and 2015 of each city on this population × inequality chart.
Color encodes variation.


<Example spec="/specs/yaml/population-arrows.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-arrow-variation-chart).

## Specification

::: code-group
<<< @/specs/esm/population-arrows.js [JavaScript]
<<< @/specs/yaml/population-arrows.yaml [YAML]
<<< @/specs/json/population-arrows.json [JSON]
:::
