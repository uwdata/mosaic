import vgplot as vg

stocks = vg.parquet("data/stocks.parquet")
labels = vg.table(
    "SELECT MAX(Date) as Date, ARGMAX(Close, Date) AS Close, Symbol FROM stocks GROUP BY Symbol"
)

point = vg.param({"date": "2013-05-13"})

view = vg.plot(
    vg.rule_x(x=point),
    vg.text_x(x=point, text=point, frame_anchor="top", line_anchor="bottom", dy=-7),
    vg.text(
        labels,
        x="Date",
        y=vg.sql(
            "Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)"
        ),
        dx=2,
        text="Symbol",
        fill="Symbol",
        text_anchor="start",
    ),
    vg.line_y(
        stocks,
        x="Date",
        y=vg.sql(
            "Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)"
        ),
        stroke="Symbol",
    ),
    vg.nearest_x(bind=point),
    vg.y_scale("log"),
    vg.y_domain([0.2, 6]),
    vg.y_grid(True),
    vg.x_label(None),
    vg.y_label(None),
    vg.y_tick_format("%"),
    vg.width(680),
    vg.height(400),
    vg.margin_right(35),
)

view
