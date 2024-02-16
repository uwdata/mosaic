<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Seattle Temperatures

Historical monthly temperatures in Seattle, WA. The gray range shows the minimum and maximum recorded temperatures. The blue range shows the average lows and highs.

<Example spec="/specs/yaml/seattle-temp.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/seattle-temp.js [JavaScript]
<<< @/public/specs/yaml/seattle-temp.yaml [YAML]
<<< @/public/specs/json/seattle-temp.json [JSON]
:::
