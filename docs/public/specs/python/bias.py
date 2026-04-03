import json
import vgplot as vg

meta = vg.meta(title="Bias Parameter", description="Dynamically adjust queried values by adding a Param value. The SQL expression is re-computed in the database upon updates.\n")
data = vg.data(
    walk=vg.parquet("data/random-walk.parquet")
)

view = vg.vconcat(
    vg.slider(label="Bias", as_="$point", min=0, max=1000, step=1),
    vg.plot(
            vg.area_y(data=vg.from_("walk"), x="t", y={
                "sql": "v + $point"
            }, fill="steelblue"),
            vg.width(680),
            vg.height(200)
        )
)

params = {
    "point": 0
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))