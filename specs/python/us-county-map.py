import json
import vgplot as vg

meta = vg.meta(title="U.S. Counties", description="A map of U.S. counties. County name tooltips are anchored to invisible centroid dot marks. Requires the DuckDB `spatial` extension.\n")
data = vg.data(
    counties={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "counties"
},
    states={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "states"
}
)

view = vg.plot(
    vg.geo(data=vg.from_("counties"), stroke="currentColor", stroke_width=0.25),
    vg.geo(data=vg.from_("states"), stroke="currentColor", stroke_width=1),
    vg.dot(data=vg.from_("counties"), x={
        "centroidX": "geom"
    }, y={
        "centroidY": "geom"
    }, r=2, fill="transparent", tip=True, title="name"),
    vg.margin(0),
    vg.projection_type("albers")
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))