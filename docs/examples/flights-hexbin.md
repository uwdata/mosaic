<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Flights Hexbin

Hexagonal bins show the density of over 200,000 flights by departure time and arrival delay.
Select regions in the marginal histograms to filter the density display.


<Example spec="/specs/yaml/flights-hexbin.yaml" />

## Specification

::: code-group
<<< @/specs/esm/flights-hexbin.js [JavaScript]
<<< @/specs/yaml/flights-hexbin.yaml [YAML]
<<< @/specs/json/flights-hexbin.json [JSON]
:::
