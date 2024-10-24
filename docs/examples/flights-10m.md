<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Cross-Filter Flights (10M)

Histograms showing arrival delay, departure time, and distance flown for 10 million flights.
Once loaded, automatic pre-aggregation optimizations enable efficient cross-filtered selections.

_You may need to wait a few seconds for the dataset to load._

<Example spec="/specs/yaml/flights-10m.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/flights-10m.js [JavaScript]
<<< @/public/specs/yaml/flights-10m.yaml [YAML]
<<< @/public/specs/json/flights-10m.json [JSON]
:::
