import vgplot as vg

meta = vg.meta(
    title="Cross-Filter Flights (200k)",
    description="Histograms showing arrival delay, departure time, and distance flown for over 200,000 flights. Select a histogram region to cross-filter the charts. Each plot uses an `intervalX` interactor to populate a shared Selection with `crossfilter` resolution.\n",
)
flights = vg.parquet("data/flights-200k.parquet")

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
        vg.y_tick_format("s"),
        vg.width(600),
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
        vg.y_tick_format("s"),
        vg.width(600),
        vg.height(200),
    ),
    vg.plot(
        vg.rect_y(
            data="flights",
            filter_by=brush,
            x=vg.bin("distance"),
            y=vg.count(),
            fill="steelblue",
            inset_left=0.5,
            inset_right=0.5,
        ),
        vg.interval_x(bind=brush),
        vg.x_domain("Fixed"),
        vg.x_label("Flight Distance (miles)"),
        vg.y_tick_format("s"),
        vg.width(600),
        vg.height(200),
    ),
)

spec = vg.spec()
