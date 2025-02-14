<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Density Groups

Density plots of penguin bill depths, grouped by species. The normalize parameter supports different forms of comparison, controlling if an individual density estimate is scaled by total point mass or normalized by the sum or max of the point mass. The stack and offset parameters control stacking of density areas.

<Example spec="/specs/yaml/density-groups.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/density-groups.js [JavaScript]
<<< @/public/specs/yaml/density-groups.yaml [YAML]
<<< @/public/specs/json/density-groups.json [JSON]
:::
