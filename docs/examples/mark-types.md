<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Mark Types

A subset of supported mark types.

- Row 1: `barY`, `lineY`, `text`, `tickY`, `areaY`
- Row 2: `regressionY`, `hexbin`, `contour`, `raster`, `denseLine`


<Example spec="/specs/yaml/mark-types.yaml" />

## Specification

::: code-group
<<< @/specs/esm/mark-types.js [JavaScript]
<<< @/specs/yaml/mark-types.yaml [YAML]
<<< @/specs/json/mark-types.json [JSON]
:::
