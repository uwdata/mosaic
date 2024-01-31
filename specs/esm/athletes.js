import * as vg from "@uwdata/vgplot";

await vg.coordinator().exec(
  vg.loadParquet("athletes", "data/athletes.parquet")
);

const $query = vg.Selection.intersect();

export default vg.hconcat(
  vg.vconcat(
    vg.hconcat(
      vg.menu({label: "Sport", as: $query, from: "athletes", column: "sport"}),
      vg.menu({label: "Sex", as: $query, from: "athletes", column: "sex"}),
      vg.search({
        label: "Name",
        as: $query,
        from: "athletes",
        column: "name",
        type: "contains"
      })
    ),
    vg.vspace(10),
    vg.plot(
      vg.dot(
        vg.from("athletes", {filterBy: $query}),
        {x: "weight", y: "height", fill: "sex", r: 2, opacity: 0.1}
      ),
      vg.regressionY(
        vg.from("athletes", {filterBy: $query}),
        {x: "weight", y: "height", stroke: "sex"}
      ),
      vg.intervalXY({as: $query, brush: {fillOpacity: 0, stroke: "black"}}),
      vg.xyDomain(vg.Fixed),
      vg.colorDomain(vg.Fixed),
      vg.margins({left: 35, top: 20, right: 1}),
      vg.width(570),
      vg.height(350)
    ),
    vg.vspace(5),
    vg.table({
      from: "athletes",
      maxWidth: 570,
      height: 250,
      filterBy: $query,
      columns: ["name", "nationality", "sex", "height", "weight", "sport"],
      width: {name: 180, nationality: 100, sex: 50, height: 50, weight: 50, sport: 100}
    })
  )
);