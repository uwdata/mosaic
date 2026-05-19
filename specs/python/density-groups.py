import vgplot as vg

meta = vg.meta(
    title="Density Groups",
    description="Density plots of penguin bill depths, grouped by species. The normalize parameter supports different forms of comparison, controlling if an individual density estimate is scaled by total point mass or normalized by the sum or max of the point mass. The stack and offset parameters control stacking of density areas.\n",
)
data = vg.data(penguins=vg.parquet("data/penguins.parquet"))

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
            data="penguins",
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

spec = vg.spec(meta, data, view)
