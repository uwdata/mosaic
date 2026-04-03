import json
import vgplot as vg

meta = vg.meta(title="Athlete Height Intervals", description="Confidence intervals of Olympic athlete heights, in meters. Data are batched into groups of 10 samples per sport. Use the samples slider to see how the intervals update as the sample size increases (as in [online aggregation](https://en.wikipedia.org/wiki/Online_aggregation)). For each sport, the numbers on the right show the maximum number of athletes in the full dataset.\n")
data = vg.data(
    athletesBatched={
    "type": "parquet",
    "file": "data/athletes.parquet",
    "select": [
    "*",
    "10 * CEIL(ROW_NUMBER() OVER (PARTITION BY sport) / 10) AS batch"
],
    "where": "height IS NOT NULL"
}
)

view = vg.hconcat(
    vg.vconcat(
            vg.hconcat(
                        vg.slider(select="interval", as_="$query", column="batch", from_="athletesBatched", step=10, value=20, label="Max Samples"),
                        vg.slider(as_="$ci", min=0.5, max=0.999, step=0.001, label="Conf. Level")
                    ),
            vg.plot(
                        vg.errorbar_x(data={
                            "from": "athletesBatched",
                            "filterBy": "$query"
                        }, ci="$ci", x="height", y="sport", stroke="sex", stroke_width=1, marker="tick", sort={
                            "y": "-x"
                        }),
                        vg.text(data=vg.from_("athletesBatched"), frame_anchor="right", font_size=8, fill="#999", dx=25, text={
                            "count": ""
                        }, y="sport"),
                        vg.name("heights"),
                        vg.x_domain([
                            1.5,
                            2.1
                        ]),
                        vg.y_domain("Fixed"),
                        vg.y_grid(True),
                        vg.y_label(None),
                        vg.margin_top(5),
                        vg.margin_left(105),
                        vg.margin_right(30),
                        vg.height(420)
                    ),
            {
                "legend": "color",
                "for": "heights"
            }
        )
)

params = {
    "ci": 0.95,
    "query": {
    "select": "single"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))