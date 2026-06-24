import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

sel = vg.selection.intersect()

view = vg.hconcat(
    vg.plot(
        vg.frame(),
        vg.dot(penguins, x="bill_length", y="bill_depth", fill="#aaa", r=1),
        vg.dot(
            penguins,
            x="bill_length",
            y="bill_depth",
            fill="species",
            fx="sex",
            fy="species",
        ),
        vg.interval_xy(bind=sel, brush=vg.brush(stroke="transparent")),
        vg.highlight(by=sel),
        vg.name("plot"),
        vg.grid(True),
        vg.margin_right(60),
        vg.x_domain("Fixed"),
        vg.y_domain("Fixed"),
        vg.fx_domain("Fixed"),
        vg.fy_domain("Fixed"),
        vg.fx_label(None),
        vg.fy_label(None),
    )
)

