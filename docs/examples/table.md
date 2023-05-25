<script setup>
  import Example from '../components/Example.vue';
  import { reset } from '@uwdata/vgplot';
  reset();
</script>

# Sortable Table

A sortable, "infinite scroll" `table` view over a backing database table.
Click column headers to sort, or command-click to reset the order.
Data is queried as needed as the table is sorted or scrolled.


<Example spec="/specs/yaml/table.yaml" />

## Specification

::: code-group
<<< @/specs/esm/table.js [JavaScript]
<<< @/specs/yaml/table.yaml [YAML]
<<< @/specs/json/table.json [JSON]
:::
