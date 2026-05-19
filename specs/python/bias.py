import vgplot as vg

meta = vg.meta(
    title="Bias Parameter",
    description="Dynamically adjust queried values by adding a Param value. The SQL expression is re-computed in the database upon updates.\n",
)
data = vg.data(walk=vg.parquet("data/random-walk.parquet"))

point = vg.param(0)

view = vg.vconcat(
    vg.slider(label="Bias", bind=point, min=0, max=1000, step=1),
    vg.plot(
        vg.area_y(data="walk", x="t", y=vg.sql("v + $point"), fill="steelblue"),
        vg.width(680),
        vg.height(200),
    ),
)

spec = vg.spec(meta, data, view)
