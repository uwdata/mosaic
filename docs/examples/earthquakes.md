<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Earthquakes

A rotatable globe of earthquake activity.
To show land masses, this example loads a TopoJSON file directly in the browser, bypassing the database.


<Example spec="/specs/yaml/earthquakes.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-earthquake-globe).

## Specification

::: code-group
<<< @/specs/esm/earthquakes.js [JavaScript]
<<< @/specs/yaml/earthquakes.yaml [YAML]
<<< @/specs/json/earthquakes.json [JSON]
:::
