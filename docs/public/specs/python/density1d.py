import vgplot as vg

flights = vg.parquet("data/flights-200k.parquet")

brush = vg.selection.crossfilter()
bandwidth = vg.param(20)

view = vg.vconcat(
    vg.slider(label="Bandwidth (σ)", bind=bandwidth, min=0.1, max=100, step=0.1),
    vg.plot(
        vg.density_y(
            data="flights",
            filter_by=brush,
            x="delay",
            fill="#888",
            fill_opacity=0.5,
            bandwidth=bandwidth,
        ),
        vg.interval_x(bind=brush),
        vg.y_axis(None),
        vg.x_domain("Fixed"),
        vg.width(600),
        vg.margin_left(10),
        vg.height(200),
    ),
    vg.plot(
        vg.density_y(
            data="flights",
            filter_by=brush,
            x="distance",
            fill="#888",
            fill_opacity=0.5,
            bandwidth=bandwidth,
        ),
        vg.interval_x(bind=brush),
        vg.y_axis(None),
        vg.x_scale("log"),
        vg.x_domain("Fixed"),
        vg.width(600),
        vg.margin_left(10),
        vg.height(200),
    ),
)

view
