import vgplot as vg

states = vg.spatial("data/us-counties-10m.json", layer="states")
nation = vg.spatial("data/us-counties-10m.json", layer="nation")
walmarts = vg.parquet("data/walmarts.parquet")

view = vg.vconcat(
    vg.plot(
        vg.geo(states, stroke="#aaa", stroke_width=1),
        vg.geo(nation, stroke="currentColor"),
        vg.dot(
            walmarts,
            x="longitude",
            y="latitude",
            fy=vg.sql("10 * decade(date)"),
            r=1.5,
            fill="blue",
        ),
        vg.axis_fy(frame_anchor="top", dy=30, tick_format="d"),
        vg.margin(0),
        vg.fy_label(None),
        vg.projection_type("albers"),
    )
)

