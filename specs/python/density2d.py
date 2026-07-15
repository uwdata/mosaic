import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

bandwidth = vg.param(20)
bins = vg.param(20)

view = vg.vconcat(
    vg.hconcat(
        vg.slider(label="Bandwidth (σ)", bind=bandwidth, min=1, max=100),
        vg.slider(label="Bins", bind=bins, min=10, max=60),
    ),
    vg.plot(
        vg.density(
            penguins,
            x="bill_length",
            y="bill_depth",
            r="density",
            fill="species",
            fill_opacity=0.5,
            width=bins,
            height=bins,
            bandwidth=bandwidth,
        ),
        vg.dot(penguins, x="bill_length", y="bill_depth", fill="currentColor", r=1),
        vg.r_range([0, 16]),
        vg.x_axis("bottom"),
        vg.x_label_anchor("center"),
        vg.y_axis("right"),
        vg.y_label_anchor("center"),
        vg.margins(top=5, bottom=30, left=5, right=50),
        vg.width(700),
        vg.height(480),
    ),
)
