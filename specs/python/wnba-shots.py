import json
import vgplot as vg

meta = vg.meta(title="WNBA Shot Chart", description="Every field goal attempt in the 2023 WNBA regular season. Shots are grouped into hexagonal bins, with color indicating shot potency (average score) and size indicating the total count of shots per location. The menu filters isolate shots by team or athlete.\n", credit="Data from [Wehoop](https://wehoop.sportsdataverse.org/). Design inspired by [Kirk Goldsberry](https://en.wikipedia.org/wiki/Kirk_Goldsberry) and a [UW CSE 512](https://courses.cs.washington.edu/courses/cse512/24sp/) project by Mackenzie Pitts and Madeline Brown.\n")
data = vg.data(
    shots={
    "type": "parquet",
    "file": "data/wnba-shots-2023.parquet",
    "where": "NOT starts_with(type, 'Free Throw') AND season_type = 2"
},
    court=vg.parquet("data/wnba-half-court.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", from_="shots", column="team_name", as_="$filter", label="Team"),
            vg.input("menu", from_="shots", column="athlete_name", filter_by="$filter", as_="$filter", label="Athlete")
        ),
    {
        "vspace": 5
    },
    vg.plot(
            vg.frame(stroke_opacity=0.5),
            vg.hexgrid(bin_width="$binWidth", stroke_opacity=0.05),
            vg.hexbin(data={
                "from": "shots",
                "filterBy": "$filter"
            }, bin_width="$binWidth", x="x_position", y="y_position", fill={
                "avg": "score_value"
            }, r={
                "count": ""
            }, tip={
                "format": {
                "x": False,
                "y": False
            }
            }),
            vg.line(data=vg.from_("court"), stroke_linecap="butt", stroke_opacity=0.5, x="x", y="y", z="z"),
            vg.name("shot-chart"),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.margin(5),
            vg.x_domain([
                0,
                50
            ]),
            vg.y_domain([
                0,
                40
            ]),
            vg.color_domain("Fixed"),
            vg.color_scheme("YlOrRd"),
            vg.color_scale("linear"),
            vg.color_label("Avg. Shot Value"),
            vg.r_scale("log"),
            vg.r_range([
                3,
                9
            ]),
            vg.r_label("Shot Count"),
            vg.aspect_ratio(1),
            vg.width(510)
        ),
    {
        "legend": "color",
        "for": "shot-chart"
    }
)

params = {
    "filter": {
    "select": "crossfilter"
},
    "binWidth": 18
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))