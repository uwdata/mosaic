<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Flights Hexbin

Hexagonal bins show the density of over 200,000 flights by departure time and arrival delay. Select regions in the marginal histograms to filter the density display.

<Example spec="/specs/yaml/flights-hexbin.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/flights-hexbin.js [JavaScript]
<<< @/public/specs/yaml/flights-hexbin.yaml [YAML]
<<< @/public/specs/json/flights-hexbin.json [JSON]
:::
