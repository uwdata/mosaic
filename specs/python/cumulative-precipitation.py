import vgplot as vg

seattle_2015 = vg.parquet(
    "data/seattle-weather.parquet",
    where="date >= DATE '2015-01-01' AND date < DATE '2016-01-01'",
)

view = vg.vconcat(
    vg.plot(
        vg.bar_y(
            seattle_2015,
            x=vg.date_month("date"),
            y=vg.sum("precipitation"),
            fill="steelblue",
        ),
        vg.x_scale("band"),
        vg.x_tick_format("%b"),
        vg.x_label(None),
        vg.y_label("Monthly precipitation (mm)"),
        vg.y_grid(True),
        vg.width(680),
        vg.height(200),
    ),
    vg.plot(
        vg.line_y(
            seattle_2015,
            x=vg.date_month("date"),
            y=vg.sum({"sum": "precipitation"}, orderby={"dateMonth": "date"}),
            stroke="steelblue",
            marker="circle",
        ),
        vg.x_tick_format("%b"),
        vg.x_label(None),
        vg.y_label("Cumulative precipitation (mm)"),
        vg.y_grid(True),
        vg.y_zero(True),
        vg.width(680),
        vg.height(240),
    ),
)
