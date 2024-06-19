import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec([
  vg.loadParquet("shots", "data/wnba-shots-2023.parquet", {where: "NOT starts_with(type, 'Free Throw') AND season_type = 2"}),
  vg.loadParquet("court", "data/wnba-half-court.parquet")
]);

const $filter = vg.Selection.crossfilter();
const $binWidth = vg.Param.value(18);

export default vg.vconcat(
  vg.hconcat(
    vg.menu({from: "shots", column: "team_name", as: $filter, label: "Team"}),
    vg.menu({
      from: "shots",
      column: "athlete_name",
      filterBy: $filter,
      as: $filter,
      label: "Athlete"
    })
  ),
  vg.vspace(5),
  vg.plot(
    vg.frame({strokeOpacity: 0.5}),
    vg.hexgrid({binWidth: $binWidth, strokeOpacity: 0.05}),
    vg.hexbin(
      vg.from("shots", {filterBy: $filter}),
      {
        binWidth: $binWidth,
        x: "x_position",
        y: "y_position",
        fill: vg.avg("score_value"),
        r: vg.count(),
        tip: {format: {x: false, y: false}}
      }
    ),
    vg.line(
      vg.from("court"),
      {strokeLinecap: "butt", strokeOpacity: 0.5, x: "x", y: "y", z: "z"}
    ),
    vg.name("shot-chart"),
    vg.xAxis(null),
    vg.yAxis(null),
    vg.margin(5),
    vg.xDomain([0, 50]),
    vg.yDomain([0, 40]),
    vg.colorDomain(vg.Fixed),
    vg.colorScheme("YlOrRd"),
    vg.colorScale("linear"),
    vg.colorLabel("Avg. Shot Value"),
    vg.rScale("log"),
    vg.rRange([3, 9]),
    vg.rLabel("Shot Count"),
    vg.aspectRatio(1),
    vg.width(510)
  ),
  vg.colorLegend({for: "shot-chart"})
);