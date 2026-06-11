import vgplot as vg

wave = vg.csv("data/m4-area-sine.csv")

brush = vg.selection.intersect()

view = vg.vconcat(
    vg.plot(
        vg.area_y(data="wave", filter_by=brush, x="time_stamp", y="power"),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180),
    ),
    vg.vspace(5),
    vg.plot(
        vg.area_y(
            data="wave", filter_by=brush, optimize=False, x="time_stamp", y="power"
        ),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180),
    ),
    vg.vspace(10),
    vg.plot(
        vg.area_y(data="wave", optimize=False, x="time_stamp", y="power"),
        vg.interval_x(bind=brush),
        vg.y_domain("Fixed"),
        vg.width(680),
        vg.height(90),
    ),
)

spec = vg.spec()
