import json
import mosaic.vgplot as vg

meta = vg.meta(title="Normalized Stock Prices", description="What is the return on investment for different days? Hover over the chart to normalize the stock prices for the percentage return on a given day. A `nearestX` interactor selects the nearest date, and parameterized expressions reactively update in response.\n")
data = vg.data(
    stocks=vg.parquet("data/stocks.parquet"),
    labels=vg.table("SELECT MAX(Date) as Date, ARGMAX(Close, Date) AS Close, Symbol FROM stocks GROUP BY Symbol")
)

view = vg.plot(
    vg.rule_x(x="$point"),
    vg.text_x(x="$point", text="$point", frame_anchor="top", line_anchor="bottom", dy=-7),
    vg.text(data=vg.from_("labels"), x="Date", y={
        "sql": "Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)"
    }, dx=2, text="Symbol", fill="Symbol", text_anchor="start"),
    vg.line_y(data=vg.from_("stocks"), x="Date", y={
        "sql": "Close / (SELECT max(Close) FROM stocks WHERE Symbol = source.Symbol AND Date = $point)"
    }, stroke="Symbol"),
    {
        "select": "nearestX",
        "as": "$point"
    },
    vg.y_scale("log"),
    vg.y_domain([
        0.2,
        6
    ]),
    vg.y_grid(True),
    vg.x_label(None),
    vg.y_label(None),
    vg.y_tick_format("%"),
    vg.width(680),
    vg.height(400),
    vg.margin_right(35)
)

spec = vg.spec(meta=meta, data=data, params={
    "point": {
    "date": "2013-05-13"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))