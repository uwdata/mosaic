import vgplot as vg

latency = vg.parquet(
    "https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/observable-latency.parquet"
)

filter = vg.selection.crossfilter()
highlight = vg.selection.intersect()

view = vg.vconcat(
    vg.plot(
        vg.frame(fill="black"),
        vg.raster(
            data="latency",
            filter_by=filter,
            x="time",
            y="latency",
            fill=vg.argmax("route", "count"),
            fill_opacity=vg.sum("count"),
            width=2016,
            height=500,
            image_rendering="pixelated",
        ),
        vg.interval_xy(bind=filter),
        vg.color_domain("Fixed"),
        vg.color_scheme("observable10"),
        vg.opacity_domain([0, 25]),
        vg.opacity_clamp(True),
        vg.y_scale("log"),
        vg.y_label("↑ Duration (ms)"),
        vg.y_domain([0.5, 10000]),
        vg.y_tick_format("s"),
        vg.x_scale("utc"),
        vg.x_label(None),
        vg.x_domain([1706227200000, 1706832000000]),
        vg.width(680),
        vg.height(300),
        vg.margins(left=35, top=20, bottom=30, right=20),
    ),
    vg.plot(
        vg.bar_x(
            data="latency",
            filter_by=filter,
            x=vg.sum("count"),
            y="route",
            fill="route",
            sort=vg.sort(y="-x", limit=15),
        ),
        vg.toggle_y(bind=filter),
        vg.toggle_y(bind=highlight),
        vg.highlight(by=highlight),
        vg.color_domain("Fixed"),
        vg.x_label("Routes by Total Requests"),
        vg.x_tick_format("s"),
        vg.y_label(None),
        vg.width(680),
        vg.height(300),
        vg.margin_top(5),
        vg.margin_left(220),
        vg.margin_bottom(35),
    ),
)

