import json
import vgplot as vg

meta = vg.meta(title="Linear Regression", description="A linear regression plot predicting athletes' heights based on their weights. Regression computation is performed in the database. The area around a regression line shows a 95% confidence interval. Select a region to view regression results for a data subset.\n")
data = vg.data(
    athletes=vg.parquet("data/athletes.parquet")
)

view = vg.plot(
    vg.dot(data=vg.from_("athletes"), x="weight", y="height", fill="sex", r=2, opacity=0.05),
    vg.regression_y(data={
        "from": "athletes",
        "filterBy": "$query"
    }, x="weight", y="height", stroke="sex"),
    {
        "select": "intervalXY",
        "as": "$query",
        "brush": {
        "fillOpacity": 0,
        "stroke": "currentColor"
    }
    },
    vg.xy_domain("Fixed"),
    vg.color_domain("Fixed")
)

params = {
    "query": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))