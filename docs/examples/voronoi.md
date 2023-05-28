<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Voronoi Diagram

The `voronoi` mark shows the regions closest to each point.
It is [constructed from its dual](https://observablehq.com/@mbostock/the-delaunays-dual), a Delaunay triangle mesh.
Reveal triangulations or convex hulls using the dropdowns.


<Example spec="/specs/yaml/voronoi.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-voronoi-scatterplot).

## Specification

::: code-group
<<< @/specs/esm/voronoi.js [JavaScript]
<<< @/specs/yaml/voronoi.yaml [YAML]
<<< @/specs/json/voronoi.json [JSON]
:::
