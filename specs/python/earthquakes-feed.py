import json
import vgplot as vg

meta = vg.meta(title="Earthquakes Feed", description="Earthquake data from the USGS live feed. To show land masses, this example loads and parses TopoJSON data in the database. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-live-earthquake-map).")
data = vg.data(
    feed={
    "type": "spatial",
    "file": "data/usgs-feed.geojson"
},
    world={
    "type": "spatial",
    "file": "data/countries-110m.json",
    "layer": "land"
}
)

view = vg.plot(
    vg.geo(data=vg.from_("world"), fill="currentColor", fill_opacity=0.2),
    vg.sphere(stroke_width=0.5),
    vg.geo(data=vg.from_("feed"), r={
        "sql": "POW(10, mag)"
    }, stroke="red", fill="red", fill_opacity=0.2, title="title", href="url", target="_blank"),
    vg.margin(2),
    vg.projection_type("equirectangular")
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))