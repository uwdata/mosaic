<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Driving Shifts into Reverse

A connected scatter plot of miles driven vs. gas prices.

<Example spec="/specs/yaml/driving-shifts.yaml" />

**Credit**: Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-connected-scatterplot), which in turn adapts Hannah Fairfield's [New York Times article](http://www.nytimes.com/imagepages/2010/05/02/business/02metrics.html).


## Specification

::: code-group
<<< @/public/specs/esm/driving-shifts.js [JavaScript]
<<< @/public/specs/yaml/driving-shifts.yaml [YAML]
<<< @/public/specs/json/driving-shifts.json [JSON]
<<< @/public/specs/python/driving-shifts.py [Python]
:::
