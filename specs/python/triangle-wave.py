import vgplot as vg

_meta = vg.meta(title="Triangle Wave", description="A test specification to compare M4 optimized and unoptimized line charts.\n")
_data = vg.data(
    wave={
    "type": "csv",
    "file": "data/triangle-wave-day.csv"
}
)

brush = vg.Selection.intersect()

_view = vg.vconcat(
    vg.plot(
        vg.line_y(data=vg.from_("wave"), x="time_stamp", y="power", z=None, stroke="time_stamp"),
        {
            "select": "intervalX",
            "as": brush
        },
        vg.x_label(None),
        vg.width(680),
        vg.height(150)
    ),
    vg.vspace(5),
    vg.plot(
        vg.line_y(data={
            "from": "wave",
            "filterBy": brush
        }, x="time_stamp", y="power", z=None, stroke="time_stamp"),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(150)
    ),
    vg.vspace(5),
    vg.plot(
        vg.line_y(data={
            "from": "wave",
            "filterBy": brush,
            "optimize": False
        }, x="time_stamp", y="power", z=None, stroke="time_stamp"),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(150)
    )
)

spec = vg.spec(meta=_meta, data=_data, params={"brush": brush}, view=_view)