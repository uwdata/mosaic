<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Pan & Zoom

Linked panning and zooming across plots: drag to pan, scroll to zoom. `panZoom` interactors update a set of bound selections, one per unique axis.

<Example spec="/specs/yaml/pan-zoom.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/pan-zoom.js [JavaScript]
<<< @/public/specs/yaml/pan-zoom.yaml [YAML]
<<< @/public/specs/json/pan-zoom.json [JSON]
<<< @/public/specs/python/pan-zoom.py [Python]
:::
