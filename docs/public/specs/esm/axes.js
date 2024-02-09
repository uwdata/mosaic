import * as vg from "@uwdata/vgplot";

export default vg.plot(
  vg.gridY({strokeDasharray: [0.75, 2], strokeOpacity: 1}),
  vg.axisY({anchor: "left", tickSize: 0, dx: 38, dy: -4, lineAnchor: "bottom"}),
  vg.axisY({
    anchor: "right",
    tickSize: 0,
    tickPadding: 5,
    label: "y-axis",
    labelAnchor: "center"
  }),
  vg.axisX({label: "x-axis", labelAnchor: "center"}),
  vg.gridX(),
  vg.ruleY([0]),
  vg.xDomain([0, 100]),
  vg.yDomain([0, 100]),
  vg.xInsetLeft(36),
  vg.marginLeft(0),
  vg.marginRight(35),
  vg.width(680)
);