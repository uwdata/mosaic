<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# Observable Latency

Web request latency on Observable.com.
Each pixel in the heatmap shows the most common route (URL pattern) at a given response latency within a time interval.
Use the bar chart of most-requested routes to filter the heatmap and isolate specific patterns.

_You may need to wait a few seconds for the dataset to load._

<Example spec="/specs/yaml/observable-latency.yaml" />

**Credit**: Adapted from an [Observable Framework example](https://observablehq.com/framework/examples/api/).

## Specification

::: code-group
<<< @/public/specs/esm/observable-latency.js [JavaScript]
<<< @/public/specs/yaml/observable-latency.yaml [YAML]
<<< @/public/specs/json/observable-latency.json [JSON]
:::
