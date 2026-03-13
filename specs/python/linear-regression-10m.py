import json
import mosaic.vgplot as vg

meta = vg.meta(title="Linear Regression 10M", description="A linear regression plot predicting flight arrival delay based on the time of departure, over 10 million flight records. Regression computation is performed in the database, with optimized selection updates using pre-aggregated materialized views. The area around a regression line shows a 95% confidence interval. Select a region to view regression results for a data subset.\n")
data = vg.data(
    flights10m=vg.table("SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/flights-10m.parquet'"),
    flights10p=vg.table("SELECT * FROM flights10m USING SAMPLE 10%"),
    flights5p=vg.table("SELECT * FROM flights10m USING SAMPLE 5%"),
    flights1p=vg.table("SELECT * FROM flights10m USING SAMPLE 1%")
)

view = vg.vconcat(
    vg.input("menu", label="Sample", as_="$data", options=[
        {
        "value": "flights10m",
        "label": "Full Data"
    },
        {
        "value": "flights10p",
        "label": "10% Sample"
    },
        {
        "value": "flights5p",
        "label": "5% Sample"
    },
        {
        "value": "flights1p",
        "label": "1% Sample"
    }
    ]),
    {
        "vspace": 10
    },
    vg.plot(
            vg.raster(data=vg.from_("$data"), x="time", y="delay", pixel_size=4, pad=0, image_rendering="pixelated"),
            vg.regression_y(data=vg.from_("$data"), x="time", y="delay", stroke="gray"),
            vg.regression_y(data={
                "from": "$data",
                "filterBy": "$query"
            }, x="time", y="delay", stroke="firebrick"),
            {
                "select": "intervalXY",
                "as": "$query",
                "brush": {
                "fillOpacity": 0,
                "stroke": "currentColor"
            }
            },
            vg.x_domain([
                0,
                24
            ]),
            vg.y_domain([
                -60,
                180
            ]),
            vg.color_scale("symlog"),
            vg.color_scheme("blues"),
            vg.color_domain("Fixed")
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "data": "flights10m",
    "query": {
    "select": "intersect"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))