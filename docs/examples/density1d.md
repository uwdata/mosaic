<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Density 1D

Density plots (`densityY` mark) for over 200,000 flights, created using kernel density estimation. Binning is performned in-database, subsequent smoothing in-browser. The distance density uses a log-scaled domain. To change the amount of smoothing, use the slider to set the kernel bandwidth.

<Example spec="/specs/yaml/density1d.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/density1d.js [JavaScript]
<<< @/public/specs/yaml/density1d.yaml [YAML]
<<< @/public/specs/json/density1d.json [JSON]
:::
