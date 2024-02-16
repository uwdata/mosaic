import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadExtension("spatial"),
  vg.loadParquet("rides", "https://uwdata.github.io/mosaic-datasets/data/nyc-rides-2010.parquet", {
  select: [
  "ST_Transform(ST_Point(pickup_latitude, pickup_longitude), 'EPSG:4326', 'ESRI:102718') AS pick",
  "ST_Transform(ST_Point(dropoff_latitude, dropoff_longitude), 'EPSG:4326', 'ESRI:102718') AS drop"
]
}),
  `CREATE TEMP TABLE IF NOT EXISTS trips AS SELECT
  ST_X(pick) AS px, ST_Y(pick) AS py,
  ST_X(drop) AS dx, ST_Y(drop) AS dy
FROM rides`
]);

const $filter = vg.Selection.crossfilter();

const defaultAttributes = [
  vg.width(335),
  vg.height(550),
  vg.margin(0),
  vg.xAxis(null),
  vg.yAxis(null),
  vg.xDomain([975000, 1005000]),
  vg.yDomain([190000, 240000]),
  vg.colorScale("symlog")
];

export default vg.hconcat(
  vg.plot(
    vg.raster(
      vg.from("trips", {filterBy: $filter}),
      {x: "px", y: "py", binType: "normal", binWidth: 1, bandwidth: 0}
    ),
    vg.intervalXY({as: $filter}),
    vg.text(
      [{label: "Taxi Pickups"}],
      {
        dx: 10,
        dy: 10,
        text: "label",
        fill: "black",
        fontSize: "1.2em",
        frameAnchor: "top-left"
      }
    ),
    ...defaultAttributes,
    vg.colorScheme("blues")
  ),
  vg.hspace(10),
  vg.plot(
    vg.raster(
      vg.from("trips", {filterBy: $filter}),
      {x: "dx", y: "dy", binType: "normal", binWidth: 1, bandwidth: 0}
    ),
    vg.intervalXY({as: $filter}),
    vg.text(
      [{label: "Taxi Dropoffs"}],
      {
        dx: 10,
        dy: 10,
        text: "label",
        fill: "black",
        fontSize: "1.2em",
        frameAnchor: "top-left"
      }
    ),
    ...defaultAttributes,
    vg.colorScheme("oranges")
  )
);