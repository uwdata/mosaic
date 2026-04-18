import vgplot as vg

_data = vg.data(
    aapl={
    "type": "parquet",
    "file": "data/stocks.parquet",
    "where": "Symbol = 'AAPL'"
}
)

_view = vg.plot(
    vg.line_y(data=vg.from_("aapl"), x="Date", y="Close"),
    vg.width(680),
    vg.height(200)
)

spec = vg.spec(data=_data, view=_view)