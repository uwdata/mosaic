<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# NYC Taxi Rides

Pickup and dropoff points for 1M NYC taxi rides on Jan 1-3, 2010.
This example projects lon/lat coordinates in the database upon load.
Select a region in one plot to filter the other.
What spatial patterns can you find?
Requires the DuckDB `spatial` extension.

_You may need to wait a few seconds for the dataset to load._

<Example spec="/specs/yaml/nyc-taxi-rides.yaml" />

## Specification

::: code-group
<<< @/public/specs/esm/nyc-taxi-rides.js [JavaScript]
<<< @/public/specs/yaml/nyc-taxi-rides.yaml [YAML]
<<< @/public/specs/json/nyc-taxi-rides.json [JSON]
:::
