import json
import mosaic.vgplot as vg

meta = vg.meta(title="Airline Travelers", description="A labeled line chart comparing airport travelers in 2019 and 2020.", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-labeled-line-chart).")
data = vg.data(
    travelers=vg.parquet("data/travelers.parquet"),
    endpoint=vg.table("SELECT * FROM travelers ORDER BY date DESC LIMIT 1")
)

view = vg.plot(
    vg.rule_y(data=[
        0
    ]),
    vg.line_y(data=vg.from_("travelers"), x="date", y="previous", stroke_opacity=0.35),
    vg.line_y(data=vg.from_("travelers"), x="date", y="current"),
    vg.text(data=vg.from_("endpoint"), x="date", y="previous", text=[
        "2019"
    ], fill_opacity=0.5, line_anchor="bottom", dy=-6),
    vg.text(data=vg.from_("endpoint"), x="date", y="current", text=[
        "2020"
    ], line_anchor="top", dy=6),
    vg.y_grid(True),
    vg.y_label("↑ Travelers per day"),
    vg.y_tick_format("s")
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))