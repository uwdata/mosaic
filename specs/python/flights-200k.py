import json
import mosaic.vgplot as vg

meta = vg.meta(title="Cross-Filter Flights (200k)", description="Histograms showing arrival delay, departure time, and distance flown for over 200,000 flights. Select a histogram region to cross-filter the charts. Each plot uses an `intervalX` interactor to populate a shared Selection with `crossfilter` resolution.\n")
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
            vg.y_tick_format("s"),
            vg.width(600),
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
            vg.y_tick_format("s"),
            vg.width(600),
            vg.height(200)
        ),
    vg.plot(
            vg.rect_y(data={
                "from": "flights",
                "filterBy": "$brush"
            }, x={
                "bin": "distance"
            }, y={
                "count": ""
            }, fill="steelblue", inset_left=0.5, inset_right=0.5),
            {
                "select": "intervalX",
                "as": "$brush"
            },
            vg.x_domain("Fixed"),
            vg.x_label("Flight Distance (miles)"),
            vg.y_tick_format("s"),
            vg.width(600),
            vg.height(200)
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "brush": {
    "select": "crossfilter"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))