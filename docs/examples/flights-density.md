<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Flights Density

Density `heatmap` and `contour` lines for 200,000+ flights by departure hour and arrival delay. The sliders adjust the smoothing (bandwidth) and number of contour thresholds.

<Example spec="/specs/yaml/flights-density.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/flights-density.js [JavaScript]
<<< @/public/specs/yaml/flights-density.yaml [YAML]
<<< @/public/specs/json/flights-density.json [JSON]
:::
