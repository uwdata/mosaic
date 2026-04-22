import vgplot as vg

_meta = vg.meta(title="U.S. Unemployment", description="A choropleth map of unemployment rates for U.S. counties. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-us-choropleth).")
_data = vg.data(
    counties={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "counties"
},
    rates=vg.parquet("data/us-county-unemployment.parquet"),
    combined=vg.table("SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id")
)

_view = vg.vconcat(
    {
        "legend": "color",
        "for": "county-map",
        "label": "Unemployment (%)"
    },
    vg.plot(
        vg.geo(data=vg.from_("combined"), fill="rate", title={
            "sql": "concat(rate, '%')"
        }),
        vg.name("county-map"),
        vg.margin(0),
        vg.color_scale("quantile"),
        vg.color_n(9),
        vg.color_scheme("blues"),
        vg.projection_type("albers-usa")
    )
)

spec = vg.spec(meta=_meta, data=_data, view=_view)