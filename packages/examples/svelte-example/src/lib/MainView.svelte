<script>
  import {
    coordinator as defaultCoordinator,
    Selection,
  } from "@uwdata/mosaic-core";
  import { makeClient } from "@uwdata/mosaic-core";

  import Count from "./Count.svelte";
  import Plots from "./Plots.svelte";
  import Histogram from "./Histogram.svelte";

  import { bridgeCount } from "../react/Count";

  const coordinator = defaultCoordinator();
  const selection = Selection.crossfilter();
</script>

<h2>vgplot chart</h2>
<Plots {selection} />

<h2>makeClient examples</h2>

<h4>Count component</h4>
<Count {coordinator} table="weather" {selection} />

<h4>Count component (React)</h4>
<div
  use:bridgeCount={{
    coordinator: coordinator,
    table: "weather",
    selection: selection,
  }}
></div>

<h4>Histogram</h4>
<Histogram {coordinator} table="weather" {selection} />
