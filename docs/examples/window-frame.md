<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Time-Based Moving Average

Moving averages of Apple (AAPL) daily closing prices, computed over date-based window frames rather than a fixed number of rows. The black line averages prices within 15 days before and after each date; the red line averages over 3 months before and after. Because frames are defined by date intervals, gaps such as weekends and holidays are handled correctly.

<Example spec="/specs/yaml/window-frame.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/window-frame.js [JavaScript]
<<< @/public/specs/yaml/window-frame.yaml [YAML]
<<< @/public/specs/json/window-frame.json [JSON]
<<< @/public/specs/python/window-frame.py [Python]
:::
