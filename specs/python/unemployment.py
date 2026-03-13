import json
import mosaic.vgplot as vg

meta = vg.meta(title="U.S. Unemployment", description="A choropleth map of unemployment rates for U.S. counties. Requires the DuckDB `spatial` extension.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-us-choropleth).")
data = vg.data(
    counties={
    "type": "spatial",
    "file": "data/us-counties-10m.json",
    "layer": "counties"
},
    rates=vg.parquet("data/us-county-unemployment.parquet"),
    combined=vg.table("SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id")
)

view = vg.vconcat(
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

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))