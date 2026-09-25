<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Cumulative Precipitation

Monthly and cumulative precipitation in Seattle during 2015. The bars sum daily observations within each month. The line uses a nested aggregate to accumulate those monthly totals through the year.

<Example spec="/specs/yaml/cumulative-precipitation.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/cumulative-precipitation.js [JavaScript]
<<< @/public/specs/yaml/cumulative-precipitation.yaml [YAML]
<<< @/public/specs/json/cumulative-precipitation.json [JSON]
<<< @/public/specs/python/cumulative-precipitation.py [Python]
:::
