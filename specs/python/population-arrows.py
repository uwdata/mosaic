import json
import mosaic.vgplot as vg

meta = vg.meta(title="Population Change Arrows", description="An `arrow` connects the positions in 1980 and 2015 of each city on this population × inequality chart. Color encodes variation.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-arrow-variation-chart).")
data = vg.data(
    metros=vg.parquet("data/metros.parquet")
)

view = vg.vconcat(
    {
        "legend": "color",
        "for": "arrows",
        "label": "Change in inequality from 1980 to 2015"
    },
    vg.plot(
            vg.arrow(data=vg.from_("metros"), x1="POP_1980", y1="R90_10_1980", x2="POP_2015", y2="R90_10_2015", bend="$bend", stroke={
                "sql": "R90_10_2015 - R90_10_1980"
            }),
            vg.text(data=vg.from_("metros"), x="POP_2015", y="R90_10_2015", filter="highlight", text="nyt_display", fill="currentColor", dy=-6),
            vg.name("arrows"),
            vg.grid(True),
            vg.inset(10),
            vg.x_scale("log"),
            vg.x_label("Population →"),
            vg.y_label("↑ Inequality"),
            vg.y_ticks(4),
            vg.color_scheme("BuRd"),
            vg.color_tick_format("+f")
        ),
    vg.input("menu", label="Bend Arrows?", options=[
        True,
        False
    ], as_="$bend")
)

spec = vg.spec(meta=meta, data=data, params={
    "bend": True
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))