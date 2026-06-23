import vgplot as vg

metros = vg.parquet("data/metros.parquet")

bend = vg.param(True)

view = vg.vconcat(
    vg.color_legend(plot="arrows", label="Change in inequality from 1980 to 2015"),
    vg.plot(
        vg.arrow(
            metros,
            x1="POP_1980",
            y1="R90_10_1980",
            x2="POP_2015",
            y2="R90_10_2015",
            bend=bend,
            stroke=vg.sql("R90_10_2015 - R90_10_1980"),
        ),
        vg.text(
            metros,
            x="POP_2015",
            y="R90_10_2015",
            filter="highlight",
            text="nyt_display",
            fill="currentColor",
            dy=-6,
        ),
        vg.name("arrows"),
        vg.grid(True),
        vg.inset(10),
        vg.x_scale("log"),
        vg.x_label("Population →"),
        vg.y_label("↑ Inequality"),
        vg.y_ticks(4),
        vg.color_scheme("BuRd"),
        vg.color_tick_format("+f"),
    ),
    vg.menu(label="Bend Arrows?", options=[True, False], bind=bend),
)

view
