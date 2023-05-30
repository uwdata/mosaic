<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Density 2D

A 2D `density` plot in which circle size indicates the point density.
To change the amount of smoothing, use the slider to set the kernel bandwidth.

<Example spec="/specs/yaml/density2d.yaml" />

## Specification

::: code-group
<<< @/specs/esm/density2d.js [JavaScript]
<<< @/specs/yaml/density2d.yaml [YAML]
<<< @/specs/json/density2d.json [JSON]
:::
