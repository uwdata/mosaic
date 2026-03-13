import json
import mosaic.vgplot as vg

meta = vg.meta(title="Earthquakes Globe", description="A rotatable globe of earthquake activity. To show land masses, this example loads and parses TopoJSON data in the database. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-earthquake-globe).")
data = vg.data(
    earthquakes=vg.parquet("data/earthquakes.parquet"),
    land={
    "type": "spatial",
    "file": "data/countries-110m.json",
    "layer": "land"
}
)

view = vg.vconcat(
    vg.hconcat(
            vg.slider(label="Longitude", as_="$longitude", min=-180, max=180, step=1),
            vg.slider(label="Latitude", as_="$latitude", min=-90, max=90, step=1)
        ),
    vg.plot(
            vg.geo(data=vg.from_("land"), geometry={
                "geojson": "geom"
            }, fill="currentColor", fill_opacity=0.2),
            vg.sphere(),
            vg.dot(data=vg.from_("earthquakes"), x="longitude", y="latitude", r={
                "sql": "POW(10, magnitude)"
            }, stroke="red", fill="red", fill_opacity=0.2),
            vg.margin(10),
            vg.style("overflow: visible;"),
            vg.projection_type("orthographic"),
            vg.projection_rotate("$rotate")
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "longitude": -180,
    "latitude": -30,
    "rotate": [
    "$longitude",
    "$latitude"
]
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))