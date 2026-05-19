import vgplot as vg

meta = vg.meta(
    title="U.S. Counties",
    description="A map of U.S. counties. County name tooltips are anchored to invisible centroid dot marks. Requires the DuckDB `spatial` extension.\n",
)
data = vg.data(
    counties=vg.spatial("data/us-counties-10m.json", layer="counties"),
    states=vg.spatial("data/us-counties-10m.json", layer="states"),
)

view = vg.plot(
    vg.geo(data="counties", stroke="currentColor", stroke_width=0.25),
    vg.geo(data="states", stroke="currentColor", stroke_width=1),
    vg.dot(
        data="counties",
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

spec = vg.spec(meta, data, view)
