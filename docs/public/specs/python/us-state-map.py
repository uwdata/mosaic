import vgplot as vg

meta = vg.meta(
    title="U.S. States",
    description="A map of U.S. states overlaid with computed centroids. Requires the DuckDB `spatial` extension.\n",
    credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-state-centroids).",
)
states = vg.spatial("data/us-counties-10m.json", layer="states")

view = vg.plot(
    vg.geo(states, stroke="currentColor", stroke_width=1),
    vg.dot(
        states,
        x=vg.centroid_x("geom"),
        y=vg.centroid_y("geom"),
        r=2,
        fill="steelblue",
        tip=True,
        title="name",
    ),
    vg.margin(0),
    vg.projection_type("albers"),
)

spec = vg.spec()
