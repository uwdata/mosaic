import json
import vgplot as vg

meta = vg.meta(title="Line Multi-Series", description="This line chart shows the unemployment rate of various U.S. metro divisions from 2000 through 2013. On hover, the closest data point to the pointer and its associated series is highlighted. Highlighting of series is performed using `nearestX` and `highlight` interactors. Point and text annotations instead use the mark `select` filter option.\n", credit="Adapted from a [D3 example](https://observablehq.com/@d3/multi-line-chart/2). Data from the [Bureau of Labor Statistics](https://www.bls.gov/).\n")
data = vg.data(
    bls_unemp=vg.parquet("data/bls-metro-unemployment.parquet")
)

view = vg.plot(
    vg.rule_y(data=[
        0
    ]),
    vg.line_y(data={
        "from": "bls_unemp",
        "optimize": False
    }, x="date", y="unemployment", z="division", stroke="steelblue", stroke_opacity=0.9, curve="monotone-x"),
    {
        "select": "nearestX",
        "channels": [
        "z"
    ],
        "as": "$curr"
    },
    {
        "select": "highlight",
        "by": "$curr"
    },
    vg.dot(data=vg.from_("bls_unemp"), x="date", y="unemployment", z="division", r=2, fill="currentColor", select="nearestX"),
    vg.text(data=vg.from_("bls_unemp"), x="date", y="unemployment", text="division", fill="currentColor", dy=-8, select="nearestX"),
    vg.margin_left(24),
    vg.x_label(None),
    vg.x_ticks(10),
    vg.y_label("Unemployment (%)"),
    vg.y_grid(True),
    vg.style("overflow: visible;"),
    vg.width(680)
)

params = {
    "curr": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))