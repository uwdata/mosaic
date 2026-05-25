import vgplot as vg

penguins = vg.parquet("data/penguins.parquet")

bandwidth = vg.param(40)
thresholds = vg.param(10)

view = vg.vconcat(
    vg.hconcat(
        vg.slider(label="Bandwidth (σ)", bind=bandwidth, min=1, max=100),
        vg.slider(label="Thresholds", bind=thresholds, min=2, max=20),
    ),
    vg.plot(
        vg.heatmap(
            penguins,
            x="bill_length",
            y="bill_depth",
            fill="species",
            bandwidth=bandwidth,
        ),
        vg.contour(
            penguins,
            x="bill_length",
            y="bill_depth",
            stroke="species",
            bandwidth=bandwidth,
            thresholds=thresholds,
        ),
        vg.dot(penguins, x="bill_length", y="bill_depth", fill="currentColor", r=1),
        vg.x_axis("bottom"),
        vg.x_label_anchor("center"),
        vg.y_axis("right"),
        vg.y_label_anchor("center"),
        vg.margins(top=5, bottom=30, left=5, right=50),
        vg.width(700),
        vg.height(480),
    ),
)

spec = vg.spec()
