import vgplot as vg

_meta = vg.meta(title="Sortable Table", description="A sortable, \"infinite scroll\" `table` view over a backing database table. Click column headers to sort, or command-click to reset the order. Data is queried as needed as the table is sorted or scrolled.\n")
_data = vg.data(
    flights=vg.parquet("data/flights-200k.parquet")
)

_view = vg.input("table", from_="flights", height=300)

spec = vg.spec(meta=_meta, data=_data, view=_view)