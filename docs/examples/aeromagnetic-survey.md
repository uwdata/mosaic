<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Aeromagnetic Survey

A raster visualization of the 1955 [Great Britain aeromagnetic survey](https://www.bgs.ac.uk/datasets/gb-aeromagnetic-survey/), which measured the Earth’s magnetic field by plane. Each sample recorded the longitude and latitude alongside the strength of the [IGRF](https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field) in [nanoteslas](https://en.wikipedia.org/wiki/Tesla_(unit)). This example demonstrates both raster interpolation and smoothing (blur) options.

<Example spec="/specs/yaml/aeromagnetic-survey.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-igfr90-raster).

## Specification

::: code-group
<<< @/public/specs/esm/aeromagnetic-survey.js [JavaScript]
<<< @/public/specs/yaml/aeromagnetic-survey.yaml [YAML]
<<< @/public/specs/json/aeromagnetic-survey.json [JSON]
<<< @/public/specs/python/aeromagnetic-survey.py [Python]
:::
