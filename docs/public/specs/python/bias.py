import vgplot as vg

walk = vg.parquet("data/random-walk.parquet")

point = vg.param(0)

view = vg.vconcat(
    vg.slider(label="Bias", bind=point, min=0, max=1000, step=1),
    vg.plot(
        vg.area_y(walk, x="t", y=vg.sql("v + $point"), fill="steelblue"),
        vg.width(680),
        vg.height(200),
    ),
)
