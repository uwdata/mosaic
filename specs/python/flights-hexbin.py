import vgplot as vg

flights = vg.parquet("data/flights-200k.parquet")

scale = vg.param("log")
query = vg.selection.intersect()

view = vg.vconcat(
    vg.hconcat(
        vg.menu(label="Color Scale", bind=scale, options=["log", "linear", "sqrt"]),
        vg.hspace(10),
        vg.color_legend(plot="hexbins"),
    ),
    vg.hconcat(
        vg.plot(
            vg.rect_y(
                flights, x=vg.bin("time"), y=vg.count(), fill="steelblue", inset=0.5
            ),
            vg.interval_x(bind=query),
            vg.margins(left=5, right=5, top=30, bottom=0),
            vg.x_domain("Fixed"),
            vg.x_axis("top"),
            vg.y_axis(None),
            vg.x_label_anchor("center"),
            vg.width(605),
            vg.height(70),
        ),
        vg.hspace(80),
    ),
    vg.hconcat(
        vg.plot(
            vg.hexbin(
                data="flights",
                filter_by=query,
                x="time",
                y="delay",
                fill=vg.count(),
                bin_width=10,
            ),
            vg.hexgrid(bin_width=10),
            vg.name("hexbins"),
            vg.color_scheme("ylgnbu"),
            vg.color_scale(scale),
            vg.margins(left=5, right=0, top=0, bottom=5),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.xy_domain("Fixed"),
            vg.width(600),
            vg.height(455),
        ),
        vg.plot(
            vg.rect_x(
                flights, x=vg.count(), y=vg.bin("delay"), fill="steelblue", inset=0.5
            ),
            vg.interval_y(bind=query),
            vg.margins(left=0, right=50, top=4, bottom=5),
            vg.y_domain([-60, 180]),
            vg.x_axis(None),
            vg.y_axis("right"),
            vg.y_label_anchor("center"),
            vg.width(80),
            vg.height(455),
        ),
    ),
)
