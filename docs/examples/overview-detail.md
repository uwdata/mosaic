<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Overview + Detail

Select the top "overview" series to zoom the "focus" view below. An `intervalX` interactor updates a selection that filters the focus view. The `line` and `area` marks can apply [M4](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization) optimization to reduce the number of data points returned: rather than draw all points, a dramatically smaller subset can still faithfully represent these area charts.

<Example spec="/specs/yaml/overview-detail.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/overview-detail.js [JavaScript]
<<< @/public/specs/yaml/overview-detail.yaml [YAML]
<<< @/public/specs/json/overview-detail.json [JSON]
<<< @/public/specs/python/overview-detail.py [Python]
:::
