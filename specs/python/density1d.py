import vgplot as vg

meta = vg.meta(
    title="Density 1D",
    description="Density plots (`densityY` mark) for over 200,000 flights, created using kernel density estimation. Binning is performned in-database, subsequent smoothing in-browser. The distance density uses a log-scaled domain. To change the amount of smoothing, use the slider to set the kernel bandwidth.\n",
)
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

spec = vg.spec()
