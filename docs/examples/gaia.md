<script setup>
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Gaia Star Catalog

A 5M row sample of the 1.8B element Gaia star catalog.
You may need to wait a few seconds for the dataset to load.
A `raster` sky map reveals our Milky Way galaxy. Select high parallax stars in the histogram to reveal a
[Hertzsprung-Russel diagram](https://en.wikipedia.org/wiki/Hertzsprung%E2%80%93Russell_diagram)
in the plot of stellar color vs. magnitude on the right.

<Example spec="/specs/yaml/gaia.yaml" />

## Specification

::: code-group
<<< @/specs/esm/gaia.js [JavaScript]
<<< @/specs/yaml/gaia.yaml [YAML]
<<< @/specs/json/gaia.json [JSON]
:::
