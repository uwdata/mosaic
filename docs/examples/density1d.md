<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Density 1D

Density plots (`densityY` mark) for over 200,000 flights, created using kernel density estimation.
Binning is performned in-database, subsequent smoothing in-browser.
To change the amount of smoothing, use the slider to set the kernel bandwidth.


<Example spec="/specs/yaml/density1d.yaml" />

## Specification

::: code-group
<<< @/specs/esm/density1d.js [JavaScript]
<<< @/specs/yaml/density1d.yaml [YAML]
<<< @/specs/json/density1d.json [JSON]
:::
