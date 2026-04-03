import json
import vgplot as vg

meta = vg.meta(title="Triangle Wave", description="A test specification to compare M4 optimized and unoptimized line charts.\n")
data = vg.data(
    wave={
    "type": "csv",
    "file": "data/triangle-wave-day.csv"
}
)

view = vg.vconcat(
    vg.plot(
            vg.line_y(data=vg.from_("wave"), x="time_stamp", y="power", z=None, stroke="time_stamp"),
            {
                "select": "intervalX",
                "as": "$brush"
            },
            vg.x_label(None),
            vg.width(680),
            vg.height(150)
        ),
    {
        "vspace": 5
    },
    vg.plot(
            vg.line_y(data={
                "from": "wave",
                "filterBy": "$brush"
            }, x="time_stamp", y="power", z=None, stroke="time_stamp"),
            vg.y_domain("Fixed"),
            vg.color_domain("Fixed"),
            vg.x_label(None),
            vg.width(680),
            vg.height(150)
        ),
    {
        "vspace": 5
    },
    vg.plot(
            vg.line_y(data={
                "from": "wave",
                "filterBy": "$brush",
                "optimize": False
            }, x="time_stamp", y="power", z=None, stroke="time_stamp"),
            vg.y_domain("Fixed"),
            vg.color_domain("Fixed"),
            vg.x_label(None),
            vg.width(680),
            vg.height(150)
        )
)

params = {
    "brush": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))