import vgplot as vg

athletesBatched = vg.parquet(
    "data/athletes.parquet",
    select=["*", "10 * CEIL(ROW_NUMBER() OVER (PARTITION BY sport) / 10) AS batch"],
    where="height IS NOT NULL",
)

ci = vg.param(0.95)
query = vg.selection.single()

view = vg.hconcat(
    vg.vconcat(
        vg.hconcat(
            vg.slider(
                select="interval",
                bind=query,
                column="batch",
                source=athletesBatched,
                step=10,
                value=20,
                label="Max Samples",
            ),
            vg.slider(bind=ci, min=0.5, max=0.999, step=0.001, label="Conf. Level"),
        ),
        vg.plot(
            vg.errorbar_x(
                data=athletesBatched,
                filter_by=query,
                ci=ci,
                x="height",
                y="sport",
                stroke="sex",
                stroke_width=1,
                marker="tick",
                sort=vg.sort(y="-x"),
            ),
            vg.text(
                athletesBatched,
                frame_anchor="right",
                font_size=8,
                fill="#999",
                dx=25,
                text=vg.count(),
                y="sport",
            ),
            vg.name("heights"),
            vg.x_domain([1.5, 2.1]),
            vg.y_domain("Fixed"),
            vg.y_grid(True),
            vg.y_label(None),
            vg.margin_top(5),
            vg.margin_left(105),
            vg.margin_right(30),
            vg.height(420),
        ),
        vg.color_legend(plot="heights"),
    )
)
