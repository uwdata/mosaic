<script>
  import { onMount } from "svelte";
  import * as vg from "@uwdata/vgplot";

  let { selection } = $props();

  let container;

  onMount(() => {
    $effect(() => {
      let plot = vg.plot(
        vg.areaY(vg.from("weather", { filterBy: selection }), {
          x: vg.dateMonthDay("date"),
          y1: vg.max("temp_max"),
          y2: vg.min("temp_min"),
          fill: "#ccc",
          fillOpacity: 0.25,
        }),
        vg.areaY(vg.from("weather", { filterBy: selection }), {
          x: vg.dateMonthDay("date"),
          y1: vg.avg("temp_max"),
          y2: vg.avg("temp_min"),
          fill: "steelblue",
          fillOpacity: 0.75,
        }),
        vg.intervalY({ as: selection }),
        vg.xyDomain(vg.Fixed),
        vg.yLabel("Temperature Range (°C)"),
        vg.width(680),
        vg.height(300)
      );
      container.appendChild(plot);
    });
  });
</script>

<div bind:this={container}></div>
