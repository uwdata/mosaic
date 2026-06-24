import vgplot as vg

earthquakes = vg.parquet("data/earthquakes.parquet")
land = vg.spatial("data/countries-110m.json", layer="land")

longitude = vg.param(-180)
latitude = vg.param(-30)
rotate = vg.param([longitude, latitude])

view = vg.vconcat(
    vg.hconcat(
        vg.slider(label="Longitude", bind=longitude, min=-180, max=180, step=1),
        vg.slider(label="Latitude", bind=latitude, min=-90, max=90, step=1),
    ),
    vg.plot(
        vg.geo(
            land, geometry=vg.geojson("geom"), fill="currentColor", fill_opacity=0.2
        ),
        vg.sphere(),
        vg.dot(
            earthquakes,
            x="longitude",
            y="latitude",
            r=vg.sql("POW(10, magnitude)"),
            stroke="red",
            fill="red",
            fill_opacity=0.2,
        ),
        vg.margin(10),
        vg.style("overflow: visible;"),
        vg.projection_type("orthographic"),
        vg.projection_rotate(rotate),
    ),
)

