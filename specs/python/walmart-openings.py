import vgplot as vg

_meta = vg.meta(title="Walmart Openings", description="Maps showing Walmart store openings per decade. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-map-large-multiples).")
_data = vg.data(
    states={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "states"
},
    nation={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "nation"
},
    walmarts=vg.parquet("data/walmarts.parquet")
)

_view = vg.vconcat(
    vg.plot(
        vg.geo(data=vg.from_("states"), stroke="#aaa", stroke_width=1),
        vg.geo(data=vg.from_("nation"), stroke="currentColor"),
        vg.dot(data=vg.from_("walmarts"), x="longitude", y="latitude", fy={
            "sql": "10 * decade(date)"
        }, r=1.5, fill="blue"),
        vg.axis_fy(frame_anchor="top", dy=30, tick_format="d"),
        vg.margin(0),
        vg.fy_label(None),
        vg.projection_type("albers")
    )
)

spec = vg.spec(meta=_meta, data=_data, view=_view)