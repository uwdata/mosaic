import vgplot as vg

proteins = vg.parquet("data/protein-design.parquet")

query = vg.selection.crossfilter()
point = vg.selection.intersect(empty=True)
plddt_domain = vg.param([67, 94.5])
pae_domain = vg.param([5, 29])
scheme = vg.param("observable10")

view = vg.vconcat(
    vg.hconcat(
        vg.menu(source="proteins", column="partial_t", label="Partial t", bind=query),
        vg.menu(source="proteins", column="noise", label="Noise", bind=query),
        vg.menu(
            source="proteins",
            column="gradient_decay_function",
            label="Gradient Decay",
            bind=query,
        ),
        vg.menu(
            source="proteins",
            column="gradient_scale",
            label="Gradient Scale",
            bind=query,
        ),
    ),
    vg.vspace("1.5em"),
    vg.hconcat(
        vg.plot(
            vg.rect_y(
                data="proteins",
                filter_by=query,
                x=vg.bin("plddt_total", steps=60),
                y=vg.count(),
                z="version",
                fill="version",
                order="z",
                reverse=True,
                inset_left=0.5,
                inset_right=0.5,
            ),
            vg.width(600),
            vg.height(55),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.x_domain(plddt_domain),
            vg.color_domain("Fixed"),
            vg.color_scheme(scheme),
            vg.margin_left(40),
            vg.margin_right(0),
            vg.margin_top(0),
            vg.margin_bottom(0),
        ),
        vg.hspace(5),
        vg.color_legend(plot="scatter", columns=1, bind=query),
    ),
    vg.hconcat(
        vg.plot(
            vg.frame(stroke="#ccc"),
            vg.raster(
                data="proteins",
                filter_by=query,
                x="plddt_total",
                y="pae_interaction",
                fill="version",
                pad=0,
            ),
            vg.interval_xy(
                bind=query, brush=vg.brush(stroke="currentColor", fill="transparent")
            ),
            vg.dot(
                data="proteins",
                filter_by=point,
                x="plddt_total",
                y="pae_interaction",
                fill="version",
                stroke="currentColor",
                stroke_width=0.5,
            ),
            vg.name("scatter"),
            vg.opacity_domain([0, 2]),
            vg.opacity_clamp(True),
            vg.color_domain("Fixed"),
            vg.color_scheme(scheme),
            vg.x_domain(plddt_domain),
            vg.y_domain(pae_domain),
            vg.x_label_anchor("center"),
            vg.y_label_anchor("center"),
            vg.margin_top(0),
            vg.margin_left(40),
            vg.margin_right(0),
            vg.width(600),
            vg.height(450),
        ),
        vg.plot(
            vg.rect_x(
                data="proteins",
                filter_by=query,
                x=vg.count(),
                y=vg.bin("pae_interaction", steps=60),
                z="version",
                fill="version",
                order="z",
                reverse=True,
                inset_top=0.5,
                inset_bottom=0.5,
            ),
            vg.width(55),
            vg.height(450),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.margin_top(0),
            vg.margin_left(0),
            vg.margin_right(0),
            vg.y_domain(pae_domain),
            vg.color_domain("Fixed"),
            vg.color_scheme(scheme),
        ),
    ),
    vg.vspace("1em"),
    vg.table_input(
        bind=point,
        filter_by=query,
        source="proteins",
        columns=[
            "version",
            "pae_interaction",
            "plddt_total",
            "noise",
            "gradient_decay_function",
            "gradient_scale",
            "movement",
        ],
        width=680,
        height=215,
    ),
)

spec = vg.spec(view)
