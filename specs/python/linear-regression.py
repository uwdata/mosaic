import vgplot as vg

athletes = vg.parquet("data/athletes.parquet")

query = vg.selection.intersect()

view = vg.plot(
    vg.dot(athletes, x="weight", y="height", fill="sex", r=2, opacity=0.05),
    vg.regression_y(
        data="athletes", filter_by=query, x="weight", y="height", stroke="sex"
    ),
    vg.interval_xy(bind=query, brush=vg.brush(fill_opacity=0, stroke="currentColor")),
    vg.xy_domain("Fixed"),
    vg.color_domain("Fixed"),
)
