import json
import mosaic.vgplot as vg

meta = vg.meta(title="Seattle Weather", description="An interactive view of Seattle's weather, including maximum temperature, amount of precipitation, and type of weather. By dragging on the scatter plot, you can see the proportion of days in that range that have sun, fog, drizzle, rain, or snow.\n", credit="Based on a [Vega-Lite/Altair example](https://vega.github.io/vega-lite/examples/interactive_seattle_weather.html) by Jake Vanderplas.")
data = vg.data(
    weather=vg.parquet("data/seattle-weather.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.plot(
                        vg.dot(data={
                            "from": "weather",
                            "filterBy": "$click"
                        }, x={
                            "dateMonthDay": "date"
                        }, y="temp_max", fill="weather", r="precipitation", fill_opacity=0.7),
                        {
                            "select": "intervalX",
                            "as": "$range",
                            "brush": {
                            "fill": "none",
                            "stroke": "#888"
                        }
                        },
                        {
                            "select": "highlight",
                            "by": "$range",
                            "fill": "#ccc",
                            "fillOpacity": 0.2
                        },
                        {
                            "legend": "color",
                            "as": "$click",
                            "columns": 1
                        },
                        vg.xy_domain("Fixed"),
                        vg.x_tick_format("%b"),
                        vg.color_domain("$domain"),
                        vg.color_range("$colors"),
                        vg.r_domain("Fixed"),
                        vg.r_range([
                            2,
                            10
                        ]),
                        vg.width(680),
                        vg.height(300)
                    )
        ),
    vg.plot(
            vg.bar_x(data=vg.from_("weather"), x={
                "count": ""
            }, y="weather", fill="#ccc", fill_opacity=0.2),
            vg.bar_x(data={
                "from": "weather",
                "filterBy": "$range"
            }, x={
                "count": ""
            }, y="weather", fill="weather"),
            {
                "select": "toggleY",
                "as": "$click"
            },
            {
                "select": "highlight",
                "by": "$click"
            },
            vg.x_domain("Fixed"),
            vg.y_domain("$domain"),
            vg.y_label(None),
            vg.color_domain("$domain"),
            vg.color_range("$colors"),
            vg.width(680)
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "click": {
    "select": "single"
},
    "domain": [
    "sun",
    "fog",
    "drizzle",
    "rain",
    "snow"
],
    "colors": [
    "#e7ba52",
    "#a7a7a7",
    "#aec7e8",
    "#1f77b4",
    "#9467bd"
],
    "range": {
    "select": "intersect"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))