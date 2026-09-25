import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadSpatial("land", "data/countries-110m.json", {layer: "land"})
]);

const $blueLongitude = vg.Param.value(-20);
const $blueLatitude = vg.Param.value(-5);
const $blueRotate = vg.Param.array([$blueLongitude, $blueLatitude]);
const $redLongitude = vg.Param.value(-134);
const $redLatitude = vg.Param.value(25);
const $redRotate = vg.Param.array([$redLongitude, $redLatitude]);

export default vg.vconcat(
  vg.hconcat(
    vg.slider({label: "Blue longitude", as: $blueLongitude, min: -180, max: 180, step: 1}),
    vg.slider({label: "Blue latitude", as: $blueLatitude, min: -90, max: 90, step: 1})
  ),
  vg.hconcat(
    vg.slider({label: "Red longitude", as: $redLongitude, min: -180, max: 180, step: 1}),
    vg.slider({label: "Red latitude", as: $redLatitude, min: -90, max: 90, step: 1})
  ),
  vg.zconcat(
    vg.plot(
      vg.geo(
        vg.from("land"),
        {geometry: vg.geojson("geom"), fill: "steelblue", fillOpacity: 0.4}
      ),
      vg.sphere({stroke: "steelblue"}),
      vg.width(420),
      vg.height(420),
      vg.margin(10),
      vg.style("overflow: visible;"),
      vg.projectionType("orthographic"),
      vg.projectionRotate($blueRotate)
    ),
    vg.plot(
      vg.geo(
        vg.from("land"),
        {geometry: vg.geojson("geom"), fill: "tomato", fillOpacity: 0.4}
      ),
      vg.sphere({stroke: "tomato"}),
      vg.width(420),
      vg.height(420),
      vg.margin(10),
      vg.style("overflow: visible;"),
      vg.projectionType("orthographic"),
      vg.projectionRotate($redRotate)
    )
  )
);