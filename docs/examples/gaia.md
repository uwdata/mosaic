<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Gaia Star Catalog

A 5M row sample of the 1.8B element Gaia star catalog.
A `raster` sky map reveals our Milky Way galaxy. Select high parallax stars in the histogram to reveal a
[Hertzsprung-Russel diagram](https://en.wikipedia.org/wiki/Hertzsprung%E2%80%93Russell_diagram)
in the plot of stellar color vs. magnitude on the right.

_You may need to wait a few seconds for the dataset to load._

<Example spec="/specs/yaml/gaia.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/gaia.js [JavaScript]
<<< @/public/specs/yaml/gaia.yaml [YAML]
<<< @/public/specs/json/gaia.json [JSON]
<<< @/public/specs/python/gaia.py [Python]
:::
