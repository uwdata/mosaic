import vgplot as vg

wave = vg.csv("data/triangle-wave-day.csv")

brush = vg.selection.intersect()

view = vg.vconcat(
    vg.plot(
        vg.line_y(wave, x="time_stamp", y="power", z=None, stroke="time_stamp"),
        vg.interval_x(bind=brush),
        vg.x_label(None),
        vg.width(680),
        vg.height(150),
    ),
    vg.vspace(5),
    vg.plot(
        vg.line_y(
            data="wave",
            filter_by=brush,
            x="time_stamp",
            y="power",
            z=None,
            stroke="time_stamp",
        ),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(150),
    ),
    vg.vspace(5),
    vg.plot(
        vg.line_y(
            data="wave",
            filter_by=brush,
            optimize=False,
            x="time_stamp",
            y="power",
            z=None,
            stroke="time_stamp",
        ),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(150),
    ),
)

view
