import vgplot as vg

meta = vg.meta(
    title="Pan & Zoom",
    description="Linked panning and zooming across plots: drag to pan, scroll to zoom. `panZoom` interactors update a set of bound selections, one per unique axis.\n",
)
data = vg.data(penguins=vg.parquet("data/penguins.parquet"))

xs = vg.selection.intersect()
ys = vg.selection.intersect()
zs = vg.selection.intersect()
ws = vg.selection.intersect()

view = vg.hconcat(
    vg.vconcat(
        vg.plot(
            vg.frame(),
            vg.dot(
                data="penguins",
                x="bill_length",
                y="bill_depth",
                fill="species",
                r=2,
                clip=True,
            ),
            vg.pan_zoom(x=xs, y=ys),
            vg.width(320),
            vg.height(240),
        ),
        vg.vspace(10),
        vg.plot(
            vg.frame(),
            vg.dot(
                data="penguins",
                x="bill_length",
                y="flipper_length",
                fill="species",
                r=2,
                clip=True,
            ),
            vg.pan_zoom(x=xs, y=zs),
            vg.width(320),
            vg.height(240),
        ),
    ),
    vg.hspace(10),
    vg.vconcat(
        vg.plot(
            vg.frame(),
            vg.dot(
                data="penguins",
                x="body_mass",
                y="bill_depth",
                fill="species",
                r=2,
                clip=True,
            ),
            vg.pan_zoom(x=ws, y=ys),
            vg.width(320),
            vg.height(240),
        ),
        vg.vspace(10),
        vg.plot(
            vg.frame(),
            vg.dot(
                data="penguins",
                x="body_mass",
                y="flipper_length",
                fill="species",
                r=2,
                clip=True,
            ),
            vg.pan_zoom(x=ws, y=zs),
            vg.width(320),
            vg.height(240),
        ),
    ),
)

spec = vg.spec(meta, data, view)
