<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Time-Based Moving Average

Moving averages of Apple stock prices over time-based window frames. A `range` frame spans an interval of dates around each day instead of a fixed number of rows: 15 days on either side for the black line, and 3 months on either side for the red line.

<Example spec="/specs/yaml/window-frame.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/window-frame.js [JavaScript]
<<< @/public/specs/yaml/window-frame.yaml [YAML]
<<< @/public/specs/json/window-frame.json [JSON]
<<< @/public/specs/python/window-frame.py [Python]
:::
