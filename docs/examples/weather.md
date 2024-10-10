<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Seattle Weather

An interactive view of Seattle's weather, including maximum temperature, amount of precipitation, and type of weather. By dragging on the scatter plot, you can see the proportion of days in that range that have sun, fog, drizzle, rain, or snow.

<Example spec="/specs/yaml/weather.yaml" />

**Credit**: Based on a [Vega-Lite/Altair example](https://vega.github.io/vega-lite/examples/interactive_seattle_weather.html) by Jake Vanderplas.

## Specification

::: code-group
<<< @/public/specs/esm/weather.js [JavaScript]
<<< @/public/specs/yaml/weather.yaml [YAML]
<<< @/public/specs/json/weather.json [JSON]
:::
