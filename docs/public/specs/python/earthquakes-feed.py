import vgplot as vg

feed = vg.spatial("data/usgs-feed.geojson")
world = vg.spatial("data/countries-110m.json", layer="land")

view = vg.plot(
    vg.geo(world, fill="currentColor", fill_opacity=0.2),
    vg.sphere(stroke_width=0.5),
    vg.geo(
        feed,
        r=vg.sql("POW(10, mag)"),
        stroke="red",
        fill="red",
        fill_opacity=0.2,
        title="title",
        href="url",
        target="_blank",
    ),
    vg.margin(2),
    vg.projection_type("equirectangular"),
)

