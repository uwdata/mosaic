import vgplot as vg

land = vg.spatial("data/countries-110m.json", layer="land")

blueLongitude = vg.param(-20)
blueLatitude = vg.param(-5)
blueRotate = vg.param([blueLongitude, blueLatitude])
redLongitude = vg.param(-134)
redLatitude = vg.param(25)
redRotate = vg.param([redLongitude, redLatitude])

view = vg.vconcat(
    vg.hconcat(
        vg.slider(
            label="Blue longitude", bind=blueLongitude, min=-180, max=180, step=1
        ),
        vg.slider(label="Blue latitude", bind=blueLatitude, min=-90, max=90, step=1),
    ),
    vg.hconcat(
        vg.slider(label="Red longitude", bind=redLongitude, min=-180, max=180, step=1),
        vg.slider(label="Red latitude", bind=redLatitude, min=-90, max=90, step=1),
    ),
    vg.zconcat(
        vg.plot(
            vg.geo(
                land, geometry=vg.geojson("geom"), fill="steelblue", fill_opacity=0.4
            ),
            vg.sphere(stroke="steelblue"),
            vg.width(420),
            vg.height(420),
            vg.margin(10),
            vg.style("overflow: visible;"),
            vg.projection_type("orthographic"),
            vg.projection_rotate(blueRotate),
        ),
        vg.plot(
            vg.geo(land, geometry=vg.geojson("geom"), fill="tomato", fill_opacity=0.4),
            vg.sphere(stroke="tomato"),
            vg.width(420),
            vg.height(420),
            vg.margin(10),
            vg.style("overflow: visible;"),
            vg.projection_type("orthographic"),
            vg.projection_rotate(redRotate),
        ),
    ),
)
