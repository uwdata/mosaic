<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Sketch Aggregates

Brush the height histogram to update the median weight and the number of distinct nationalities per sport. Exact medians and distinct counts can not be pre-aggregated, so by default each update queries the filtered rows. With [sketch aggregates](https://idl.uw.edu/mosaic/api/core/coordinator#sketch-aggregates) enabled, Mosaic instead pre-aggregates approximate results using mergeable sketches. Without sketches, the example works the same and shows exact results; sketches trade a small error for faster updates on large data.

<Example spec="/specs/yaml/sketch-aggregates.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/sketch-aggregates.js [JavaScript]
<<< @/public/specs/yaml/sketch-aggregates.yaml [YAML]
<<< @/public/specs/json/sketch-aggregates.json [JSON]
<<< @/public/specs/python/sketch-aggregates.py [Python]
:::
