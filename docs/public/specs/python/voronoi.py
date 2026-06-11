import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

mesh = vg.param(0)
hull = vg.param(0)

view = vg.vconcat(
    vg.plot(
        vg.voronoi(
            penguins,
            x="bill_length",
            y="bill_depth",
            stroke="white",
            stroke_width=1,
            stroke_opacity=0.5,
            fill="species",
            fill_opacity=0.2,
        ),
        vg.hull(
            penguins,
            x="bill_length",
            y="bill_depth",
            stroke="species",
            stroke_opacity=hull,
            stroke_width=1.5,
        ),
        vg.delaunay_mesh(
            penguins,
            x="bill_length",
            y="bill_depth",
            z="species",
            stroke="species",
            stroke_opacity=mesh,
            stroke_width=1,
        ),
        vg.dot(penguins, x="bill_length", y="bill_depth", fill="species", r=2),
        vg.frame(),
        vg.inset(10),
        vg.width(680),
    ),
    vg.hconcat(
        vg.menu(
            label="Delaunay Mesh",
            options=[vg.option("Hide", value=0), vg.option("Show", value=0.5)],
            bind=mesh,
        ),
        vg.hspace(5),
        vg.menu(
            label="Convex Hull",
            options=[vg.option("Hide", value=0), vg.option("Show", value=1)],
            bind=hull,
        ),
    ),
)

spec = vg.spec()
