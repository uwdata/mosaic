<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Athlete Height Intervals

Confidence intervals of Olympic athlete heights, in meters. Data are batched into groups of 10 samples per sport. Use the samples slider to see how the intervals update as the sample size increases (as in [online aggregation](https://en.wikipedia.org/wiki/Online_aggregation)). For each sport, the numbers on the right show the maximum number of athletes in the full dataset.

<Example spec="/specs/yaml/athlete-height.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/athlete-height.js [JavaScript]
<<< @/public/specs/yaml/athlete-height.yaml [YAML]
<<< @/public/specs/json/athlete-height.json [JSON]
<<< @/public/specs/python/athlete-height.py [Python]
:::
