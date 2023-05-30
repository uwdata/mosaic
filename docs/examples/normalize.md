<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Normalized Stock Prices

What is the return on investment for different days?
Hover over the chart to normalize the stock prices for the percentage
return on a given day.
A `nearestX` interactor selects the nearest date, and parameterized
expressions reactively update in response.

<Example spec="/specs/yaml/normalize.yaml" />

## Specification

::: code-group
<<< @/specs/esm/normalize.js [JavaScript]
<<< @/specs/yaml/normalize.yaml [YAML]
<<< @/specs/json/normalize.json [JSON]
:::
