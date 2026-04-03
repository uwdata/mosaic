import json
import vgplot as vg

meta = vg.meta(title="Presidential Opinion", description="Opinion poll data on historical U.S. presidents. Image marks are used to show presidential pictures. The dropdown menu toggles the opinion metric shown.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-image-medals).")
data = vg.data(
    presidents=vg.parquet("data/us-president-favorability.parquet")
)

view = vg.vconcat(
    vg.plot(
            vg.rule_y(data=[
                0
            ]),
            vg.image(data=vg.from_("presidents"), x="First Inauguration Date", y={
                "sql": "\"Very Favorable %\" + \"Somewhat Favorable %\" + $sign * (\"Very Unfavorable %\" + \"Somewhat Unfavorable %\")"
            }, src="Portrait URL", r=20, preserve_aspect_ratio="xMidYMin slice", title="Name"),
            vg.x_inset(20),
            vg.x_label("First inauguration date →"),
            vg.y_inset_top(4),
            vg.y_grid(True),
            vg.y_label("↑ Opinion (%)"),
            vg.y_tick_format("+f")
        ),
    vg.input("menu", label="Opinion Metric", options=[
        {
        "label": "Any Opinion",
        "value": 1
    },
        {
        "label": "Net Favorability",
        "value": -1
    }
    ], as_="$sign")
)

params = {
    "sign": 1
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))