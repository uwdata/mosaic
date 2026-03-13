import json
import mosaic.vgplot as vg

meta = vg.meta(title="Olympic Athletes", description="An interactive dashboard of athlete statistics. The menus and searchbox filter the display and are automatically populated by backing data columns.\n")
data = vg.data(
    athletes=vg.parquet("data/athletes.parquet")
)

view = vg.hconcat(
    vg.vconcat(
            vg.hconcat(
                        vg.input("menu", label="Sport", as_="$category", from_="athletes", column="sport"),
                        vg.input("menu", label="Sex", as_="$category", from_="athletes", column="sex"),
                        vg.input("search", label="Name", filter_by="$category", as_="$query", from_="athletes", column="name", type="contains")
                    ),
            {
                "vspace": 10
            },
            vg.plot(
                        vg.dot(data={
                            "from": "athletes",
                            "filterBy": "$query"
                        }, x="weight", y="height", fill="sex", r=2, opacity=0.1),
                        vg.regression_y(data={
                            "from": "athletes",
                            "filterBy": "$query"
                        }, x="weight", y="height", stroke="sex"),
                        {
                            "select": "intervalXY",
                            "as": "$query",
                            "brush": {
                            "fillOpacity": 0,
                            "stroke": "black"
                        }
                        },
                        vg.dot(data={
                            "from": "athletes",
                            "filterBy": "$hover"
                        }, x="weight", y="height", fill="sex", stroke="currentColor", stroke_width=1, r=3),
                        vg.xy_domain("Fixed"),
                        vg.color_domain("Fixed"),
                        vg.margins(left=35, top=20, right=1),
                        vg.width(570),
                        vg.height(350)
                    ),
            {
                "vspace": 5
            },
            vg.input("table", from_="athletes", max_width=570, height=250, filter_by="$query", as_="$hover", columns=[
                "name",
                "nationality",
                "sex",
                "height",
                "weight",
                "sport"
            ], width={
                "name": 180,
                "nationality": 100,
                "sex": 50,
                "height": 50,
                "weight": 50,
                "sport": 100
            })
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "category": {
    "select": "intersect"
},
    "query": {
    "select": "intersect",
    "include": [
    "$category"
]
},
    "hover": {
    "select": "intersect",
    "empty": True
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))