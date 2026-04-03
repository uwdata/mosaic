import json
import vgplot as vg

meta = vg.meta(title="Cross-Filter Flights (10M)", description="Histograms showing arrival delay, departure time, and distance flown for 10 million flights.\nOnce loaded, automatic pre-aggregation optimizations enable efficient cross-filtered selections.\n\n_You may need to wait a few seconds for the dataset to load._\n")
data = vg.data(
    flights10m=vg.table("SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/flights-10m.parquet'")
)

view = vg.vconcat(
    vg.plot(
            vg.rect_y(data={
                "from": "flights10m",
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
                "from": "flights10m",
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
                "from": "flights10m",
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

params = {
    "brush": {
    "select": "crossfilter"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))