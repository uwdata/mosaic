<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Line Multi-Series

This line chart shows the unemployment rate of various U.S. metro divisions from 2000 through 2013. On hover, the closest data point to the pointer and its associated series is highlighted. Highlighting of series is performed using `nearestX` and `highlight` interactors. Point and text annotations instead use the mark `select` filter option.

<Example spec="/specs/yaml/line-multi-series.yaml" />

**Credit**: Adapted from a [D3 example](https://observablehq.com/@d3/multi-line-chart/2). Data from the [Bureau of Labor Statistics](https://www.bls.gov/).


## Specification

::: code-group
<<< @/public/specs/esm/line-multi-series.js [JavaScript]
<<< @/public/specs/yaml/line-multi-series.yaml [YAML]
<<< @/public/specs/json/line-multi-series.json [JSON]
:::
