import vgplot as vg

counties = vg.spatial("data/us-counties-10m.json", layer="counties")
rates = vg.parquet("data/us-county-unemployment.parquet")
combined = vg.table(
    "SELECT a.geom AS geom, b.rate AS rate FROM counties AS a, rates AS b WHERE a.id = b.id"
)

view = vg.vconcat(
    vg.color_legend(plot="county-map", label="Unemployment (%)"),
    vg.plot(
        vg.geo(combined, fill="rate", title=vg.sql("concat(rate, '%')")),
        vg.name("county-map"),
        vg.margin(0),
        vg.color_scale("quantile"),
        vg.color_n(9),
        vg.color_scheme("blues"),
        vg.projection_type("albers-usa"),
    ),
)

