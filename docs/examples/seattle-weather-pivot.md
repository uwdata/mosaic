<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Seattle Weather Pivot

A DuckDB `PIVOT` query reshapes Seattle's daily weather observations into a cross-tab: one row per year, with a column counting the days of each weather type. The pivoted result is shown in a sortable `table` view. Click a column header to sort.

<Example spec="/specs/yaml/seattle-weather-pivot.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/seattle-weather-pivot.js [JavaScript]
<<< @/public/specs/yaml/seattle-weather-pivot.yaml [YAML]
<<< @/public/specs/json/seattle-weather-pivot.json [JSON]
<<< @/public/specs/python/seattle-weather-pivot.py [Python]
:::
