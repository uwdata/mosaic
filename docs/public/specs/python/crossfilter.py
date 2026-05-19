import vgplot as vg

data = vg.data(flights=vg.parquet("data/flights-200k.parquet"))

brush = vg.selection.crossfilter()

view = vg.vconcat(
    vg.plot(
        vg.rect_y(
            data="flights",
            filter_by=brush,
            x=vg.bin("delay"),
            y=vg.count(),
            fill="steelblue",
            inset_left=0.5,
            inset_right=0.5,
        ),
        vg.interval_x(bind=brush),
        vg.x_domain("Fixed"),
        vg.x_label("Arrival Delay (min)"),
        vg.x_label_anchor("center"),
        vg.y_tick_format("s"),
        vg.height(200),
    ),
    vg.plot(
        vg.rect_y(
            data="flights",
            filter_by=brush,
            x=vg.bin("time"),
            y=vg.count(),
            fill="steelblue",
            inset_left=0.5,
            inset_right=0.5,
        ),
        vg.interval_x(bind=brush),
        vg.x_domain("Fixed"),
        vg.x_label("Departure Time (hour)"),
        vg.x_label_anchor("center"),
        vg.y_tick_format("s"),
        vg.height(200),
    ),
)

spec = vg.spec(data, view)
