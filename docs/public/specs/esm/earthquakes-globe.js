import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadParquet("earthquakes", "data/earthquakes.parquet"),
  vg.loadSpatial("land", "data/countries-110m.json", {layer: "land"})
]);

const $longitude = vg.Param.value(-180);
const $latitude = vg.Param.value(-30);
const $rotate = vg.Param.array([$longitude, $latitude]);

export default vg.vconcat(
  vg.hconcat(
    vg.slider({label: "Longitude", as: $longitude, min: -180, max: 180, step: 1}),
    vg.slider({label: "Latitude", as: $latitude, min: -90, max: 90, step: 1})
  ),
  vg.plot(
    vg.geo(
      vg.from("land"),
      {geometry: vg.geojson("geom"), fill: "currentColor", fillOpacity: 0.2}
    ),
    vg.sphere(),
    vg.dot(
      vg.from("earthquakes"),
      {
        x: "longitude",
        y: "latitude",
        r: vg.sql`POW(10, magnitude)`,
        stroke: "red",
        fill: "red",
        fillOpacity: 0.2
      }
    ),
    vg.margin(10),
    vg.style("overflow: visible;"),
    vg.projectionType("orthographic"),
    vg.projectionRotate($rotate)
  )
);