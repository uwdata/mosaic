<script setup>
import Example from '../components/Example.vue'
</script>

# Mark Types

A subset of supported mark types:
`barY`, `lineY`, `text`, `tickY`, `areaY` (row 1),
`regressionY`, `hexbin`, `contour`, `raster`, `denseLine` (row 2)



<Example spec="/specs/yaml/marks.yaml" />


## Specification

::: code-group
<<< @/specs/esm/marks.js [ESM]
<<< @/specs/yaml/marks.yaml [YAML]
<<< @/specs/json/marks.json [JSON]
:::
