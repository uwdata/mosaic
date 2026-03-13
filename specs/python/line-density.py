import json
import mosaic.vgplot as vg

meta = vg.meta(title="Line Density", description="The `denseLine` mark shows the densities of line series, here for a collection of stock prices. The top plot normalizes by arc length to remove the vertical artifacts visible in the unnormalized plot below. Select a region in the lower plot to zoom the upper plot. The bandwidth slider smooths the data, while the pixel size menu adjusts the raster resolution.\n")
data = vg.data(
    stocks_after_2006={
    "type": "parquet",
    "file": "data/stocks_after_2006.parquet",
    "select": [
    "Symbol",
    "Close",
    "Date"
],
    "where": "Close < 100"
}
)

view = vg.vconcat(
    vg.hconcat(
            vg.slider(label="Bandwidth (σ)", as_="$bandwidth", min=0, max=10, step=0.1),
            vg.input("menu", label="Pixel Size", as_="$pixelSize", options=[
                0.5,
                1,
                2
            ])
        ),
    {
        "vspace": 10
    },
    vg.plot(
            vg.dense_line(data={
                "from": "stocks_after_2006",
                "filterBy": "$brush"
            }, x="Date", y="Close", z="Symbol", fill="density", bandwidth="$bandwidth", pixel_size="$pixelSize"),
            vg.color_scheme("$schemeColor"),
            vg.color_scale("$scaleColor"),
            vg.y_label("Close (Normalized) ↑"),
            vg.y_nice(True),
            vg.margins(left=30, top=20, right=0),
            vg.width(680),
            vg.height(240)
        ),
    vg.plot(
            vg.dense_line(data=vg.from_("stocks_after_2006"), x="Date", y="Close", z="Symbol", fill="density", normalize=False, bandwidth="$bandwidth", pixel_size="$pixelSize"),
            {
                "select": "intervalXY",
                "as": "$brush"
            },
            vg.color_scheme("$schemeColor"),
            vg.color_scale("$scaleColor"),
            vg.y_label("Close (Unnormalized) ↑"),
            vg.y_nice(True),
            vg.margins(left=30, top=20, right=0),
            vg.width(680),
            vg.height(240)
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "brush": {
    "select": "intersect"
},
    "bandwidth": 0,
    "pixelSize": 2,
    "schemeColor": "pubugn",
    "scaleColor": "sqrt"
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))