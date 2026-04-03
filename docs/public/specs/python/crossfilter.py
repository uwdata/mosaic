import json
import vgplot as vg

data = vg.data(
    flights=vg.parquet("data/flights-200k.parquet")
)

view = vg.vconcat(
    vg.plot(
            vg.rect_y(data={
                "from": "flights",
                "filterBy": "$brush"
            }, x={
                "bin": "delay"
            }, y={
                "count": ""
            }, fill="steelblue", inset_left=0.5, inset_right=0.5),
            {
                "select": "intervalX",
                "as": "$brush"
            },
            vg.x_domain("Fixed"),
            vg.x_label("Arrival Delay (min)"),
            vg.x_label_anchor("center"),
            vg.y_tick_format("s"),
            vg.height(200)
        ),
    vg.plot(
            vg.rect_y(data={
                "from": "flights",
                "filterBy": "$brush"
            }, x={
                "bin": "time"
            }, y={
                "count": ""
            }, fill="steelblue", inset_left=0.5, inset_right=0.5),
            {
                "select": "intervalX",
                "as": "$brush"
            },
            vg.x_domain("Fixed"),
            vg.x_label("Departure Time (hour)"),
            vg.x_label_anchor("center"),
            vg.y_tick_format("s"),
            vg.height(200)
        )
)

params = {
    "brush": {
    "select": "crossfilter"
}
}

spec = vg.spec(data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))