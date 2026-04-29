import vgplot as vg

_meta = vg.meta(title="Area Sine Wave", description="A test specification to compare M4 optimized and unoptimized area charts over a dense dual-tone sine wave.\n")
_data = vg.data(
    wave={
    "type": "csv",
    "file": "data/m4-area-sine.csv"
}
)

brush = vg.Selection.intersect()

_view = vg.vconcat(
    vg.plot(
        vg.area_y(data={
            "from": "wave",
            "filterBy": brush
        }, x="time_stamp", y="power"),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180)
    ),
    vg.vspace(5),
    vg.plot(
        vg.area_y(data={
            "from": "wave",
            "filterBy": brush,
            "optimize": False
        }, x="time_stamp", y="power"),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180)
    ),
    vg.vspace(10),
    vg.plot(
        vg.area_y(data={
            "from": "wave",
            "optimize": False
        }, x="time_stamp", y="power"),
        {
            "select": "intervalX",
            "as": brush
        },
        vg.y_domain("Fixed"),
        vg.width(680),
        vg.height(90)
    )
)

spec = vg.spec(_meta, _data, _view, params={"brush": brush})