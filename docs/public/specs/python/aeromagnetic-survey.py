import vgplot as vg

ca55 = vg.parquet("data/ca55-south.parquet")

interp = vg.param("random-walk")
blur = vg.param(0)

view = vg.vconcat(
    vg.hconcat(
        vg.menu(
            label="Interpolation Method",
            options=["none", "nearest", "barycentric", "random-walk"],
            bind=interp,
        ),
        vg.hspace("1em"),
        vg.slider(label="Blur", min=0, max=100, bind=blur),
    ),
    vg.vspace("1em"),
    vg.plot(
        vg.raster(
            ca55,
            x="LONGITUDE",
            y="LATITUDE",
            fill=vg.max("MAG_IGRF90"),
            interpolate=interp,
            bandwidth=blur,
        ),
        vg.color_scale("diverging"),
        vg.color_domain("Fixed"),
    ),
)

spec = vg.spec()
