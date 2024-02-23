<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Line Density

The `denseLine` mark shows the densities of line series, here for a collection of stock prices. The top plot normalizes by arc length to remove the vertical artifacts visible in the unnormalized plot below. Select a region in the lower plot to zoom the upper plot. The bandwidth slider smooths the data, while the pixel size menu adjusts the raster resolution.

<Example spec="/specs/yaml/line-density.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/line-density.js [JavaScript]
<<< @/public/specs/yaml/line-density.yaml [YAML]
<<< @/public/specs/json/line-density.json [JSON]
:::
