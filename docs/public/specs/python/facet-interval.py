import vgplot as vg

_meta = vg.meta(title="Faceted Interval Selections", description="A faceted plot with 2D interval selections.", credit="Adapted from https://observablehq.com/@observablehq/plot-non-faceted-marks")
_data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

sel = vg.Selection.intersect()

_view = vg.hconcat(
    vg.plot(
        vg.frame(),
        vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="#aaa", r=1),
        vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", fx="sex", fy="species"),
        {
            "select": "intervalXY",
            "as": sel,
            "brush": {
                "stroke": "transparent"
            }
        },
        {
            "select": "highlight",
            "by": sel
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

spec = vg.spec(meta=_meta, data=_data, params={"sel": sel}, view=_view)