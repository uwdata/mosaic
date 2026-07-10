import vgplot as vg

walk = vg.parquet("data/random-walk.parquet")

brush = vg.selection.intersect()

view = vg.vconcat(
    vg.plot(
        vg.area_y(walk, x="t", y="v", fill="steelblue"),
        vg.interval_x(bind=brush),
        vg.width(680),
        vg.height(200),
    ),
    vg.plot(
        vg.area_y(data=walk, filter_by=brush, x="t", y="v", fill="steelblue"),
        vg.y_domain("Fixed"),
        vg.width(680),
        vg.height(200),
    ),
)
