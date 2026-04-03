import json
import vgplot as vg

meta = vg.meta(title="Faceted Interval Selections", description="A faceted plot with 2D interval selections.", credit="Adapted from https://observablehq.com/@observablehq/plot-non-faceted-marks")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.hconcat(
    vg.plot(
            vg.frame(),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="#aaa", r=1),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", fx="sex", fy="species"),
            {
                "select": "intervalXY",
                "as": "$sel",
                "brush": {
                "stroke": "transparent"
            }
            },
            {
                "select": "highlight",
                "by": "$sel"
            },
            vg.name("plot"),
            vg.grid(True),
            vg.margin_right(60),
            vg.x_domain("Fixed"),
            vg.y_domain("Fixed"),
            vg.fx_domain("Fixed"),
            vg.fy_domain("Fixed"),
            vg.fx_label(None),
            vg.fy_label(None)
        )
)

params = {
    "sel": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))