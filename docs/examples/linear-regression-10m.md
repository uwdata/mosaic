<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Linear Regression 10M

A linear regression plot predicting flight arrival delay based on the time of departure, over 10 million flight records. Regression computation is performed in the database, with optimized selection updates using pre-aggregated materialized views. The area around a regression line shows a 95% confidence interval. Select a region to view regression results for a data subset.

<Example spec="/specs/yaml/linear-regression-10m.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/linear-regression-10m.js [JavaScript]
<<< @/public/specs/yaml/linear-regression-10m.yaml [YAML]
<<< @/public/specs/json/linear-regression-10m.json [JSON]
:::
