<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Cross-Filter Flights (10M)

Histograms showing arrival delay, departure time, and distance flown for 10 million flights. You may need to wait a few seconds for the dataset to load. Once loaded, automatically-generated indexes enable efficient cross-filtered selections.

<Example spec="/specs/yaml/flights-10m.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/flights-10m.js [JavaScript]
<<< @/public/specs/yaml/flights-10m.yaml [YAML]
<<< @/public/specs/json/flights-10m.json [JSON]
:::
