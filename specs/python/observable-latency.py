import json
import vgplot as vg

meta = vg.meta(title="Observable Latency", description="Web request latency on Observable.com.\nEach pixel in the heatmap shows the most common route (URL pattern) at a given response latency within a time interval.\nUse the bar chart of most-requested routes to filter the heatmap and isolate specific patterns.\nOr, select a range in the heatmap to show the corresponding most-requested routes.\n\n_You may need to wait a few seconds for the dataset to load._\n", credit="Adapted from an [Observable Framework example](https://observablehq.com/framework/examples/api/).")
data = vg.data(
    latency=vg.parquet("https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/observable-latency.parquet")
)

view = vg.vconcat(
    vg.plot(
            vg.frame(fill="black"),
            vg.raster(data={
                "from": "latency",
                "filterBy": "$filter"
            }, x="time", y="latency", fill={
                "argmax": [
                "route",
                "count"
            ]
            }, fill_opacity={
                "sum": "count"
            }, width=2016, height=500, image_rendering="pixelated"),
            {
                "select": "intervalXY",
                "as": "$filter"
            },
            vg.color_domain("Fixed"),
            vg.color_scheme("observable10"),
            vg.opacity_domain([
                0,
                25
            ]),
            vg.opacity_clamp(True),
            vg.y_scale("log"),
            vg.y_label("↑ Duration (ms)"),
            vg.y_domain([
                0.5,
                10000
            ]),
            vg.y_tick_format("s"),
            vg.x_scale("utc"),
            vg.x_label(None),
            vg.x_domain([
                1706227200000,
                1706832000000
            ]),
            vg.width(680),
            vg.height(300),
            vg.margins(left=35, top=20, bottom=30, right=20)
        ),
    vg.plot(
            vg.bar_x(data={
                "from": "latency",
                "filterBy": "$filter"
            }, x={
                "sum": "count"
            }, y="route", fill="route", sort={
                "y": "-x",
                "limit": 15
            }),
            {
                "select": "toggleY",
                "as": "$filter"
            },
            {
                "select": "toggleY",
                "as": "$highlight"
            },
            {
                "select": "highlight",
                "by": "$highlight"
            },
            vg.color_domain("Fixed"),
            vg.x_label("Routes by Total Requests"),
            vg.x_tick_format("s"),
            vg.y_label(None),
            vg.width(680),
            vg.height(300),
            vg.margin_top(5),
            vg.margin_left(220),
            vg.margin_bottom(35)
        )
)

params = {
    "filter": {
    "select": "crossfilter"
},
    "highlight": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))