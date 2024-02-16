<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Linear Regression

A linear regression plot predicting athletes' heights based on their weights. Regression computation is performed in the database. The area around a regression line shows a 95% confidence interval. Select a region to view regression results for a data subset.

<Example spec="/specs/yaml/linear-regression.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/linear-regression.js [JavaScript]
<<< @/public/specs/yaml/linear-regression.yaml [YAML]
<<< @/public/specs/json/linear-regression.json [JSON]
:::
