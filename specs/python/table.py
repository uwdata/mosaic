import vgplot as vg

flights = vg.parquet("data/flights-200k.parquet")

view = vg.table_input(source="flights", height=300)
