<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Cross-Filter Flights (200k)

Histograms showing arrival delay, departure time, and distance flown for over 200,000 flights. Select a histogram region to cross-filter the charts. Each plot uses an `intervalX` interactor to populate a shared Selection with `crossfilter` resolution.

<Example spec="/specs/yaml/flights-200k.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/flights-200k.js [JavaScript]
<<< @/public/specs/yaml/flights-200k.yaml [YAML]
<<< @/public/specs/json/flights-200k.json [JSON]
:::
