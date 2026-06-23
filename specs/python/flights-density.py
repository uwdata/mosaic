import vgplot as vg

flights = vg.parquet("data/flights-200k.parquet")

bandwidth = vg.param(7)
thresholds = vg.param(10)

view = vg.vconcat(
    vg.hconcat(
        vg.slider(label="Bandwidth (σ)", bind=bandwidth, min=1, max=100),
        vg.slider(label="Thresholds", bind=thresholds, min=2, max=20),
    ),
    vg.plot(
        vg.heatmap(flights, x="time", y="delay", fill="density", bandwidth=bandwidth),
        vg.contour(
            flights,
            x="time",
            y="delay",
            stroke="white",
            stroke_opacity=0.5,
            bandwidth=bandwidth,
            thresholds=thresholds,
        ),
        vg.color_scale("symlog"),
        vg.color_scheme("ylgnbu"),
        vg.x_axis("top"),
        vg.x_label_anchor("center"),
        vg.x_zero(True),
        vg.y_axis("right"),
        vg.y_label_anchor("center"),
        vg.margin_top(30),
        vg.margin_left(5),
        vg.margin_right(40),
        vg.width(700),
        vg.height(500),
    ),
)

view
