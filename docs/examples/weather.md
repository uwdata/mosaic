<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Seattle Weather

An interactive view of Seattle’s weather, including maximum temperature, amount of precipitation, and type of weather.
By dragging on the scatter plot, you can see the proportion of days in that range that have sun, fog, drizzle, rain, or snow.


<Example spec="/specs/yaml/weather.yaml" />

**Credit**: Based on a [Vega-Lite/Altair example](https://vega.github.io/vega-lite/examples/interactive_seattle_weather.html) by Jake Vanderplas.

## Specification

::: code-group
<<< @/specs/esm/weather.js [JavaScript]
<<< @/specs/yaml/weather.yaml [YAML]
<<< @/specs/json/weather.json [JSON]
:::
