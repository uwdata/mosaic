import vgplot as vg

presidents = vg.parquet("data/us-president-favorability.parquet")

sign = vg.param(1)

view = vg.vconcat(
    vg.plot(
        vg.rule_y(data=[0]),
        vg.image(
            presidents,
            x="First Inauguration Date",
            y=vg.sql(
                '"Very Favorable %" + "Somewhat Favorable %" + $sign * ("Very Unfavorable %" + "Somewhat Unfavorable %")'
            ),
            src="Portrait URL",
            r=20,
            preserve_aspect_ratio="xMidYMin slice",
            title="Name",
        ),
        vg.x_inset(20),
        vg.x_label("First inauguration date →"),
        vg.y_inset_top(4),
        vg.y_grid(True),
        vg.y_label("↑ Opinion (%)"),
        vg.y_tick_format("+f"),
    ),
    vg.menu(
        label="Opinion Metric",
        options=[
            vg.option("Any Opinion", value=1),
            vg.option("Net Favorability", value=-1),
        ],
        bind=sign,
    ),
)
