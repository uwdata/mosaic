<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Density 2D

A 2D `density` plot in which circle size indicates the point density. The data is divided by fill color into three sets of densities. To change the amount of smoothing, use the slider to set the kernel bandwidth.

<Example spec="/specs/yaml/density2d.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/density2d.js [JavaScript]
<<< @/public/specs/yaml/density2d.yaml [YAML]
<<< @/public/specs/json/density2d.json [JSON]
<<< @/public/specs/python/density2d.py [Python]
:::
