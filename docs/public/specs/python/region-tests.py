import json
import vgplot as vg

meta = {
    "title": "Region Interactor Tests",
    "descriptions": "Varied plots using region interactors to highlight selected values.\n"
}
data = vg.data(
    bls_unemp=vg.parquet("data/bls-metro-unemployment.parquet"),
    feed={
    "type": "spatial",
    "file": "data/usgs-feed.geojson"
},
    world={
    "type": "spatial",
    "file": "data/countries-110m.json",
    "layer": "land"
},
    counties={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "counties"
}
)

view = vg.vconcat(
    vg.plot(
            vg.rule_y(data=[
                0
            ]),
            vg.line_y(data={
                "from": "bls_unemp",
                "optimize": False
            }, x="date", y="unemployment", z="division", stroke="steelblue", stroke_opacity=0.9, curve="monotone-x"),
            {
                "select": "region",
                "channels": [
                "z"
            ],
                "as": "$series"
            },
            {
                "select": "highlight",
                "by": "$series"
            },
            vg.margin_left(24),
            vg.x_label(None),
            vg.x_ticks(10),
            vg.x_line(True),
            vg.y_line(True),
            vg.y_label("Unemployment (%)"),
            vg.y_grid(True),
            vg.margin_right(0)
        ),
    {
        "vspace": 10
    },
    vg.plot(
            vg.geo(data=vg.from_("world"), fill="currentColor", fill_opacity=0.2),
            vg.sphere(stroke_width=0.5),
            vg.geo(data=vg.from_("feed"), channels={
                "id": "id"
            }, r={
                "sql": "POW(10, mag)"
            }, stroke="red", fill="red", fill_opacity=0.2, title="title", href="url", target="_blank"),
            {
                "select": "region",
                "channels": [
                "id"
            ],
                "as": "$quakes"
            },
            {
                "select": "highlight",
                "by": "$quakes"
            },
            vg.margin(2),
            vg.projection_type("equirectangular")
        ),
    {
        "vspace": 10
    },
    vg.plot(
            vg.geo(data=vg.from_("counties"), channels={
                "id": "id"
            }, stroke="currentColor", stroke_width=0.25),
            {
                "select": "region",
                "channels": [
                "id"
            ],
                "as": "$counties"
            },
            {
                "select": "highlight",
                "by": "$counties"
            },
            vg.margin(0),
            vg.projection_type("albers")
        )
)

params = {
    "series": {
    "select": "single"
},
    "quakes": {
    "select": "single"
},
    "counties": {
    "select": "single"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))