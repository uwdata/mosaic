import json
import mosaic.vgplot as vg

meta = vg.meta(title="Overview + Detail", description="Select the top \"overview\" series to zoom the \"focus\" view below. An `intervalX` interactor updates a selection that filters the focus view. The `line` and `area` marks can apply [M4](https://observablehq.com/@uwdata/m4-scalable-time-series-visualization) optimization to reduce the number of data points returned: rather than draw all points, a dramatically smaller subset can still faithfully represent these area charts.\n")
data = vg.data(
    walk=vg.parquet("data/random-walk.parquet")
)

view = vg.vconcat(
    vg.plot(
            vg.area_y(data=vg.from_("walk"), x="t", y="v", fill="steelblue"),
            {
                "select": "intervalX",
                "as": "$brush"
            },
            vg.width(680),
            vg.height(200)
        ),
    vg.plot(
            vg.area_y(data={
                "from": "walk",
                "filterBy": "$brush"
            }, x="t", y="v", fill="steelblue"),
            vg.y_domain("Fixed"),
            vg.width(680),
            vg.height(200)
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "brush": {
    "select": "intersect"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))