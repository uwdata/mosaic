<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Line Density

The `denseLine` mark shows the densities of line series, here for a collection of stock prices.
The top plot normalizes by arc length to remove the vertical artifacts visible in the unnormalized plot below.
Select a region in the lower plot to zoom the upper plot.
The bandwidth slider smooths the data, while the bin width menu adjusts the raster resolution.


<Example spec="/specs/yaml/line-density.yaml" />

## Specification

::: code-group
<<< @/specs/esm/line-density.js [JavaScript]
<<< @/specs/yaml/line-density.yaml [YAML]
<<< @/specs/json/line-density.json [JSON]
:::
