import json
import vgplot as vg

meta = vg.meta(title="Wind Map", description="`vector` marks on a grid show both direction and intensity—here, the speed of winds. Expressions for `rotate`, `length`, and `stroke` values are evaluated in the database. Both the legend and map support interactive selections to highlight values.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-wind-map).")
data = vg.data(
    wind={
    "type": "parquet",
    "file": "data/wind.parquet",
    "select": [
    "*",
    "row_number() over () as id"
]
}
)

view = vg.vconcat(
    {
        "legend": "color",
        "for": "wind-map",
        "label": "Speed (m/s)",
        "as": "$selected"
    },
    vg.plot(
            vg.vector(data=vg.from_("wind"), x="longitude", y="latitude", rotate={
                "sql": "degrees(atan2(u, v))"
            }, length={
                "sql": "$length * sqrt(u * u + v * v)"
            }, stroke={
                "sql": "sqrt(u * u + v * v)"
            }, channels={
                "id": "id"
            }),
            {
                "select": "region",
                "as": "$selected",
                "channels": [
                "id"
            ]
            },
            {
                "select": "highlight",
                "by": "$selected"
            },
            vg.name("wind-map"),
            vg.length_scale("identity"),
            vg.color_zero(True),
            vg.inset(10),
            vg.aspect_ratio(1),
            vg.width(680)
        ),
    vg.slider(min=1, max=7, step=0.1, as_="$length", label="Vector Length")
)

params = {
    "selected": {
    "select": "union"
},
    "length": 2
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))