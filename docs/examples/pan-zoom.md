<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Pan & Zoom

Linked panning and zooming across plots: drag to pan, scroll to zoom.
`panZoom` interactors update a set of bound selections, one per unique axis.

<Example spec="/specs/yaml/pan-zoom.yaml" />

## Specification

::: code-group
<<< @/specs/esm/pan-zoom.js [JavaScript]
<<< @/specs/yaml/pan-zoom.yaml [YAML]
<<< @/specs/json/pan-zoom.json [JSON]
:::
