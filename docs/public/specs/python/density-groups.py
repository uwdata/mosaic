import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

bandwidth = vg.param(20)
normalize = vg.param("none")
stack = vg.param(False)
offset = vg.param(None)

view = vg.vconcat(
    vg.hconcat(
        vg.menu(label="Normalize", bind=normalize, options=["none", "sum", "max"]),
        vg.menu(label="Stack", bind=stack, options=[False, True]),
        vg.menu(
            label="Offset",
            bind=offset,
            options=[vg.option("none", value=None), "normalize", "center"],
        ),
    ),
    vg.plot(
        vg.density_y(
            penguins,
            x="bill_depth",
            fill="species",
            fill_opacity=0.4,
            bandwidth=bandwidth,
            normalize=normalize,
            stack=stack,
            offset=offset,
        ),
        vg.margin_left(50),
        vg.height(200),
    ),
)
