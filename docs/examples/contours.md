<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Contour Plot

Here `raster` and `contour` marks visualize the density of
data points in a scatter plot of penguin measurments.
Setting the `fill` color to `"species"` subdivides
the data into three sets of densities.

<Example spec="/specs/yaml/contours.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/contours.js [JavaScript]
<<< @/public/specs/yaml/contours.yaml [YAML]
<<< @/public/specs/json/contours.json [JSON]
:::
