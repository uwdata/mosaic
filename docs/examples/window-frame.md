<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Time-Based Moving Average

Moving averages of Apple stock prices, using `range` window frames that span 15 days (black) and 3 months (red) around each date.

<Example spec="/specs/yaml/window-frame.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/window-frame.js [JavaScript]
<<< @/public/specs/yaml/window-frame.yaml [YAML]
<<< @/public/specs/json/window-frame.json [JSON]
<<< @/public/specs/python/window-frame.py [Python]
:::
