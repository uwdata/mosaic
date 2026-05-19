import vgplot as vg

meta = vg.meta(
    title="Aeromagnetic Survey",
    description="A raster visualization of the 1955 [Great Britain aeromagnetic survey](https://www.bgs.ac.uk/datasets/gb-aeromagnetic-survey/), which measured the Earth’s magnetic field by plane. Each sample recorded the longitude and latitude alongside the strength of the [IGRF](https://www.ncei.noaa.gov/products/international-geomagnetic-reference-field) in [nanoteslas](https://en.wikipedia.org/wiki/Tesla_(unit)). This example demonstrates both raster interpolation and smoothing (blur) options.\n",
    credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-igfr90-raster).",
)
data = vg.data(ca55=vg.parquet("data/ca55-south.parquet"))

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
            data="ca55",
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

spec = vg.spec(meta, data, view)
