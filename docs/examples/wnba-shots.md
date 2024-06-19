<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# WNBA Shot Chart

Every field goal attempt in the 2023 WNBA regular season. Shots are grouped into hexagonal bins, with color indicating shot potency (average score) and size indicating the total count of shots per location. The menu filters isolate shots by team or athlete.

<Example spec="/specs/yaml/wnba-shots.yaml" />

**Credit**: Data from [Wehoop](https://wehoop.sportsdataverse.org/). Design inspired by [Kirk Goldsberry](https://en.wikipedia.org/wiki/Kirk_Goldsberry) and a [UW CSE 512](https://courses.cs.washington.edu/courses/cse512/24sp/) project by Mackenzie Pitts and Madeline Brown.


## Specification

::: code-group
<<< @/public/specs/esm/wnba-shots.js [JavaScript]
<<< @/public/specs/yaml/wnba-shots.yaml [YAML]
<<< @/public/specs/json/wnba-shots.json [JSON]
:::
