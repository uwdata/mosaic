<script setup>
import Example from '../components/Example.vue'
</script>

# Hexbin Flights

Hexagonal bins showing the density of flights by departure time and arrival delay.
Select regions in the marginal histograms to filter the density display.


<Example spec="/specs/yaml/hexbin.yaml" />

## Specification

::: code-group
<<< @/specs/esm/hexbin.js [JavaScript]
<<< @/specs/yaml/hexbin.yaml [YAML]
<<< @/specs/json/hexbin.json [JSON]
:::
