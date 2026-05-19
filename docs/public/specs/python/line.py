import vgplot as vg

data = vg.data(aapl=vg.parquet("data/stocks.parquet", where="Symbol = 'AAPL'"))

view = vg.plot(
    vg.line_y(data="aapl", x="Date", y="Close"), vg.width(680), vg.height(200)
)

spec = vg.spec(data, view)
