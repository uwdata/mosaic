import vgplot as vg

cases = vg.parquet("data/berlin-covid.parquet")

frame = vg.param([-6, 0])

view = vg.vconcat(
    vg.plot(
        vg.rect_y(
            cases, x1="day", x2=vg.sql("day + 1"), inset=1, y="cases", fill="steelblue"
        ),
        vg.line_y(
            cases,
            x=vg.sql("day + 0.5"),
            y=vg.avg("cases", orderby="day", rows=frame),
            curve="monotone-x",
            stroke="currentColor",
        ),
        vg.x_label("day"),
        vg.width(680),
        vg.height(300),
    ),
    vg.menu(
        label="Window Frame",
        bind=frame,
        options=[
            vg.option(
                "7-day moving average, with prior 6 days: [-6, 0]", value=[-6, 0]
            ),
            vg.option(
                "7-day moving average, centered at current day: [-3, 3]", value=[-3, 3]
            ),
            vg.option("Moving average, with all prior days [-∞, 0]", value=[None, 0]),
            vg.option("Global average [-∞, +∞]", value=[None, None]),
        ],
    ),
)

spec = vg.spec(view)
