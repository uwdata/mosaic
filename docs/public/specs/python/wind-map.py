import vgplot as vg

wind = vg.parquet("data/wind.parquet", select=["*", "row_number() over () as id"])

selected = vg.selection.union()
length = vg.param(2)

view = vg.vconcat(
    vg.color_legend(plot="wind-map", label="Speed (m/s)", bind=selected),
    vg.plot(
        vg.vector(
            wind,
            x="longitude",
            y="latitude",
            rotate=vg.sql("degrees(atan2(u, v))"),
            length=vg.sql("$length * sqrt(u * u + v * v)"),
            stroke=vg.sql("sqrt(u * u + v * v)"),
            channels=vg.channels(id="id"),
        ),
        vg.region(bind=selected, channels=["id"]),
        vg.highlight(by=selected),
        vg.name("wind-map"),
        vg.length_scale("identity"),
        vg.color_zero(True),
        vg.inset(10),
        vg.aspect_ratio(1),
        vg.width(680),
    ),
    vg.slider(min=1, max=7, step=0.1, bind=length, label="Vector Length"),
)

