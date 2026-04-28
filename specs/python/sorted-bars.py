import vgplot as vg

_meta = vg.meta(title="Sorted Bars", description="Sort and limit an aggregate bar chart of gold medals by country.\n")
_data = vg.data(
    athletes=vg.parquet("data/athletes.parquet")
)

query = vg.Selection.intersect()

_view = vg.vconcat(
    vg.input("menu", label="Sport", as_=query, from_="athletes", column="sport", value="aquatics"),
    vg.vspace(10),
    vg.plot(
        vg.bar_x(data={
            "from": "athletes",
            "filterBy": query
        }, x={
            "sum": "gold"
        }, y="nationality", fill="steelblue", sort={
            "y": "-x",
            "limit": 10
        }),
        vg.x_label("Gold Medals"),
        vg.y_label("Nationality"),
        vg.y_label_anchor("top"),
        vg.margin_top(15)
    )
)

spec = vg.spec(_meta, _data, _view, params={"query": query})