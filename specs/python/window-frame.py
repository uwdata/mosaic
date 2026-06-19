import vgplot as vg

aapl = vg.parquet("data/stocks.parquet", where="Symbol = 'AAPL'")

view = vg.plot(
    vg.line_y(aapl, stroke="#ccc", x="Date", y="Close"),
    vg.line_y(
        aapl,
        stroke="black",
        x="Date",
        y=vg.avg(
            "Close",
            orderby="Date",
            range=[
                {"days": 15},
                {"days": 15},
            ],
        ),
    ),
    vg.line_y(
        aapl,
        stroke="firebrick",
        x="Date",
        y=vg.avg(
            "Close",
            orderby="Date",
            range=[
                {"months": 3},
                {"months": 3},
            ],
        ),
    ),
    vg.y_label("Close"),
    vg.width(680),
    vg.height(200),
)

spec = vg.spec(view)
