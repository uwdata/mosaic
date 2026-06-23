import vgplot as vg

weather = vg.parquet("data/seattle-weather.parquet")

click = vg.selection.single()
domain = vg.param(["sun", "fog", "drizzle", "rain", "snow"])
colors = vg.param(["#e7ba52", "#a7a7a7", "#aec7e8", "#1f77b4", "#9467bd"])
range = vg.selection.intersect()

view = vg.vconcat(
    vg.hconcat(
        vg.plot(
            vg.dot(
                data="weather",
                filter_by=click,
                x=vg.date_month_day("date"),
                y="temp_max",
                fill="weather",
                r="precipitation",
                fill_opacity=0.7,
            ),
            vg.interval_x(bind=range, brush=vg.brush(fill="none", stroke="#888")),
            vg.highlight(by=range, fill="#ccc", fill_opacity=0.2),
            vg.color_legend(bind=click, columns=1),
            vg.xy_domain("Fixed"),
            vg.x_tick_format("%b"),
            vg.color_domain(domain),
            vg.color_range(colors),
            vg.r_domain("Fixed"),
            vg.r_range([2, 10]),
            vg.width(680),
            vg.height(300),
        )
    ),
    vg.plot(
        vg.bar_x(weather, x=vg.count(), y="weather", fill="#ccc", fill_opacity=0.2),
        vg.bar_x(
            data="weather", filter_by=range, x=vg.count(), y="weather", fill="weather"
        ),
        vg.toggle_y(bind=click),
        vg.highlight(by=click),
        vg.x_domain("Fixed"),
        vg.y_domain(domain),
        vg.y_label(None),
        vg.color_domain(domain),
        vg.color_range(colors),
        vg.width(680),
    ),
)

view
