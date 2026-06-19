import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

xs = vg.selection.intersect()
ys = vg.selection.intersect()
zs = vg.selection.intersect()
ws = vg.selection.intersect()

view = vg.hconcat(
    vg.vconcat(
        vg.plot(
            vg.frame(),
            vg.dot(
                penguins,
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
                penguins,
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
                penguins, x="body_mass", y="bill_depth", fill="species", r=2, clip=True
            ),
            vg.pan_zoom(x=ws, y=ys),
            vg.width(320),
            vg.height(240),
        ),
        vg.vspace(10),
        vg.plot(
            vg.frame(),
            vg.dot(
                penguins,
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

spec = vg.spec(view)
