<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Moving Average

This plot shows daily reported COVID-19 cases from March 3 (day 1) to May 5, 2020 (day 64) in Berlin, Germany, as reported by the [Robert Koch Institute](https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/nCoV.html). We can smooth the raw counts using a moving average over various choices of window query frames.

<Example spec="/specs/yaml/moving-average.yaml" />

**Credit**: Adapted from the [Arquero window query tutorial](https://observablehq.com/@uwdata/working-with-window-queries).

## Specification

::: code-group
<<< @/public/specs/esm/moving-average.js [JavaScript]
<<< @/public/specs/yaml/moving-average.yaml [YAML]
<<< @/public/specs/json/moving-average.json [JSON]
<<< @/public/specs/python/moving-average.py [Python]
:::
