import vgplot as vg

counties = vg.spatial("data/us-counties-10m.json", layer="counties")
states = vg.spatial("data/us-counties-10m.json", layer="states")

view = vg.plot(
    vg.geo(counties, stroke="currentColor", stroke_width=0.25),
    vg.geo(states, stroke="currentColor", stroke_width=1),
    vg.dot(
        counties,
        x=vg.centroid_x("geom"),
        y=vg.centroid_y("geom"),
        r=2,
        fill="transparent",
        tip=True,
        title="name",
    ),
    vg.margin(0),
    vg.projection_type("albers"),
)
