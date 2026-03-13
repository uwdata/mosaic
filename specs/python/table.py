import json
import mosaic.vgplot as vg

meta = vg.meta(title="Sortable Table", description="A sortable, \"infinite scroll\" `table` view over a backing database table. Click column headers to sort, or command-click to reset the order. Data is queried as needed as the table is sorted or scrolled.\n")
data = vg.data(
    flights=vg.parquet("data/flights-200k.parquet")
)

view = vg.input("table", from_="flights", height=300)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))