import json
import vgplot as vg

meta = vg.meta(
    title="Area Sine Wave",
    description="A test specification to compare M4 optimized and unoptimized area charts over a dense dual-tone sine wave.\n",
)

data = vg.data(
    wave={"type": "csv", "file": "data/m4-area-sine.csv"},
)

view = vg.vconcat(
    vg.plot(
        vg.area_y(
            data={"from": "wave", "filterBy": "$brush"},
            x="time_stamp",
            y="power",
        ),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180),
    ),
    vg.vspace(5),
    vg.plot(
        vg.area_y(
            data={"from": "wave", "filterBy": "$brush", "optimize": False},
            x="time_stamp",
            y="power",
        ),
        vg.y_domain("Fixed"),
        vg.color_domain("Fixed"),
        vg.x_label(None),
        vg.width(680),
        vg.height(180),
    ),
    vg.vspace(10),
    vg.plot(
        vg.area_y(
            data={"from": "wave", "optimize": False},
            x="time_stamp",
            y="power",
        ),
        {"select": "intervalX", "as": "$brush"},
        vg.y_domain("Fixed"),
        vg.width(680),
        vg.height(90),
    ),
)

params = {
    "brush": {"select": "intersect"},
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))