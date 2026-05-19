import vgplot as vg

meta = vg.meta(
    title="Line Density",
    description="The `denseLine` mark shows the densities of line series, here for a collection of stock prices. The top plot normalizes by arc length to remove the vertical artifacts visible in the unnormalized plot below. Select a region in the lower plot to zoom the upper plot. The bandwidth slider smooths the data, while the pixel size menu adjusts the raster resolution.\n",
)
stocks_after_2006 = vg.parquet(
    "data/stocks_after_2006.parquet",
    select=["Symbol", "Close", "Date"],
    where="Close < 100",
)

brush = vg.selection.intersect()
bandwidth = vg.param(0)
pixelSize = vg.param(2)
schemeColor = vg.param("pubugn")
scaleColor = vg.param("sqrt")

view = vg.vconcat(
    vg.hconcat(
        vg.slider(label="Bandwidth (σ)", bind=bandwidth, min=0, max=10, step=0.1),
        vg.menu(label="Pixel Size", bind=pixelSize, options=[0.5, 1, 2]),
    ),
    vg.vspace(10),
    vg.plot(
        vg.dense_line(
            data="stocks_after_2006",
            filter_by=brush,
            x="Date",
            y="Close",
            z="Symbol",
            fill="density",
            bandwidth=bandwidth,
            pixel_size=pixelSize,
        ),
        vg.color_scheme(schemeColor),
        vg.color_scale(scaleColor),
        vg.y_label("Close (Normalized) ↑"),
        vg.y_nice(True),
        vg.margins(left=30, top=20, right=0),
        vg.width(680),
        vg.height(240),
    ),
    vg.plot(
        vg.dense_line(
            stocks_after_2006,
            x="Date",
            y="Close",
            z="Symbol",
            fill="density",
            normalize=False,
            bandwidth=bandwidth,
            pixel_size=pixelSize,
        ),
        vg.interval_xy(bind=brush),
        vg.color_scheme(schemeColor),
        vg.color_scale(scaleColor),
        vg.y_label("Close (Unnormalized) ↑"),
        vg.y_nice(True),
        vg.margins(left=30, top=20, right=0),
        vg.width(680),
        vg.height(240),
    ),
)

spec = vg.spec()
