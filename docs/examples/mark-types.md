<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Mark Types

A subset of supported mark types.

- Row 1: `barY`, `lineY`, `text`, `tickY`, `areaY`
- Row 2: `regressionY`, `hexbin`, `contour`, `heatmap`, `denseLine`

<Example spec="/specs/yaml/mark-types.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/mark-types.js [JavaScript]
<<< @/public/specs/yaml/mark-types.yaml [YAML]
<<< @/public/specs/json/mark-types.json [JSON]
:::
