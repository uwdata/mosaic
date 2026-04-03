import json
import vgplot as vg

meta = vg.meta(title="U.S. States", description="A map of U.S. states overlaid with computed centroids. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-state-centroids).")
data = vg.data(
    states={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "states"
}
)

view = vg.plot(
    vg.geo(data=vg.from_("states"), stroke="currentColor", stroke_width=1),
    vg.dot(data=vg.from_("states"), x={
        "centroidX": "geom"
    }, y={
        "centroidY": "geom"
    }, r=2, fill="steelblue", tip=True, title="name"),
    vg.margin(0),
    vg.projection_type("albers")
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))