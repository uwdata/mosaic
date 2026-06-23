import vgplot as vg

aapl = vg.parquet("data/stocks.parquet", where="Symbol = 'AAPL'")

view = vg.plot(vg.line_y(aapl, x="Date", y="Close"), vg.width(680), vg.height(200))

view
