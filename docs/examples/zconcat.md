<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Layered Globes

Two globes layered on top of one another with `zconcat`, each rotated by its own pair of sliders, to compare the size and shape of distant landmasses (blue starts on Africa, red on Australia). The sliders sit outside the `zconcat`, so they stay usable while the globes overlap. Requires the DuckDB `spatial` extension.

<Example spec="/specs/yaml/zconcat.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/zconcat.js [JavaScript]
<<< @/public/specs/yaml/zconcat.yaml [YAML]
<<< @/public/specs/json/zconcat.json [JSON]
<<< @/public/specs/python/zconcat.py [Python]
:::
