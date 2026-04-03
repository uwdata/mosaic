import json
import vgplot as vg

meta = vg.meta(title="Gaia Star Catalog", description="A 5M row sample of the 1.8B element Gaia star catalog.\nA `raster` sky map reveals our Milky Way galaxy. Select high parallax stars in the histogram to reveal a\n[Hertzsprung-Russel diagram](https://en.wikipedia.org/wiki/Hertzsprung%E2%80%93Russell_diagram)\nin the plot of stellar color vs. magnitude on the right.\n\n_You may need to wait a few seconds for the dataset to load._\n")
data = vg.data(
    gaia=vg.table("-- compute u and v with natural earth projection\nWITH prep AS (\n  SELECT\n    radians((-l + 540) % 360 - 180) AS lambda,\n    radians(b) AS phi,\n    asin(sqrt(3)/2 * sin(phi)) AS t,\n    t^2 AS t2,\n    t2^3 AS t6,\n    *\n  FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/gaia-5m.parquet'\n  WHERE parallax BETWEEN -5 AND 20 AND phot_g_mean_mag IS NOT NULL AND bp_rp IS NOT NULL\n)\nSELECT\n  (1.340264 * \"lambda\" * cos(t)) / (sqrt(3)/2 * (1.340264 + (-0.081106 * 3 * t2) + (t6 * (0.000893 * 7 + 0.003796 * 9 * t2)))) AS u,\n  t * (1.340264 + (-0.081106 * t2) + (t6 * (0.000893 + 0.003796 * t2))) AS v,\n  * EXCLUDE('t', 't2', 't6')\nFROM prep")
)

view = vg.hconcat(
    vg.vconcat(
            vg.plot(
                        vg.raster(data={
                            "from": "gaia",
                            "filterBy": "$brush"
                        }, x="u", y="v", fill="density", bandwidth="$bandwidth", pixel_size="$pixelSize"),
                        {
                            "select": "intervalXY",
                            "pixelSize": 2,
                            "as": "$brush"
                        },
                        vg.xy_domain("Fixed"),
                        vg.color_scale("$scaleType"),
                        vg.color_scheme("viridis"),
                        vg.width(440),
                        vg.height(250),
                        vg.margin_left(25),
                        vg.margin_top(20),
                        vg.margin_right(1)
                    ),
            vg.hconcat(
                        vg.plot(
                                        vg.rect_y(data={
                                            "from": "gaia",
                                            "filterBy": "$brush"
                                        }, x={
                                            "bin": "phot_g_mean_mag"
                                        }, y={
                                            "count": ""
                                        }, fill="steelblue", inset=0.5),
                                        {
                                            "select": "intervalX",
                                            "as": "$brush"
                                        },
                                        vg.x_domain("Fixed"),
                                        vg.y_scale("$scaleType"),
                                        vg.y_grid(True),
                                        vg.width(220),
                                        vg.height(120),
                                        vg.margin_left(65)
                                    ),
                        vg.plot(
                                        vg.rect_y(data={
                                            "from": "gaia",
                                            "filterBy": "$brush"
                                        }, x={
                                            "bin": "parallax"
                                        }, y={
                                            "count": ""
                                        }, fill="steelblue", inset=0.5),
                                        {
                                            "select": "intervalX",
                                            "as": "$brush"
                                        },
                                        vg.x_domain("Fixed"),
                                        vg.y_scale("$scaleType"),
                                        vg.y_grid(True),
                                        vg.width(220),
                                        vg.height(120),
                                        vg.margin_left(65)
                                    )
                    )
        ),
    {
        "hspace": 10
    },
    vg.plot(
            vg.raster(data={
                "from": "gaia",
                "filterBy": "$brush"
            }, x="bp_rp", y="phot_g_mean_mag", fill="density", bandwidth="$bandwidth", pixel_size="$pixelSize"),
            {
                "select": "intervalXY",
                "pixelSize": 2,
                "as": "$brush"
            },
            vg.xy_domain("Fixed"),
            vg.color_scale("$scaleType"),
            vg.color_scheme("viridis"),
            vg.y_reverse(True),
            vg.width(230),
            vg.height(370),
            vg.margin_left(25),
            vg.margin_top(20),
            vg.margin_right(1)
        )
)

params = {
    "brush": {
    "select": "crossfilter"
},
    "bandwidth": 0,
    "pixelSize": 2,
    "scaleType": "sqrt"
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))