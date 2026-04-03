import json
import vgplot as vg

meta = vg.meta(title="Seattle Temperatures", description="Historical monthly temperatures in Seattle, WA. The gray range shows the minimum and maximum recorded temperatures. The blue range shows the average lows and highs.\n")
data = vg.data(
    weather=vg.parquet("data/seattle-weather.parquet")
)

view = vg.plot(
    vg.area_y(data=vg.from_("weather"), x={
        "dateMonth": "date"
    }, y1={
        "max": "temp_max"
    }, y2={
        "min": "temp_min"
    }, fill="#ccc", fill_opacity=0.25, curve="monotone-x"),
    vg.area_y(data=vg.from_("weather"), x={
        "dateMonth": "date"
    }, y1={
        "avg": "temp_max"
    }, y2={
        "avg": "temp_min"
    }, fill="steelblue", fill_opacity=0.75, curve="monotone-x"),
    vg.rule_y(data=[
        15
    ], stroke_opacity=0.5, stroke_dasharray="5 5"),
    vg.x_tick_format("%b"),
    vg.y_label("Temperature Range (°C)"),
    vg.width(680),
    vg.height(300)
)

spec = vg.spec(meta=meta, data=data, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))