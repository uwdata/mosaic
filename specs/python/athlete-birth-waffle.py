import json
import mosaic.vgplot as vg

meta = vg.meta(title="Athlete Birth Waffle", description="Waffle chart counting Olympic athletes based on which half-decade they were born. The inputs enable adjustment of waffle mark design options.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-waffle-unit).")
data = vg.data(
    athletes=vg.parquet("data/athletes.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", as_="$unit", options=[
                1,
                2,
                5,
                10,
                25,
                50,
                100
            ], label="Unit"),
            vg.input("menu", as_="$round", options=[
                True,
                False
            ], label="Round"),
            vg.input("menu", as_="$gap", options=[
                0,
                1,
                2,
                3,
                4,
                5
            ], label="Gap"),
            vg.slider(as_="$radius", min=0, max=10, step=0.1, label="Radius")
        ),
    {
        "vspace": 10
    },
    vg.plot(
            vg.waffle_y(data=vg.from_("athletes"), unit="$unit", round="$round", gap="$gap", rx="$radius", x={
                "sql": "5 * floor(year(\"date_of_birth\") / 5)"
            }, y={
                "count": ""
            }),
            vg.x_label(None),
            vg.x_tick_size(0),
            vg.x_tick_format("d")
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "unit": 10,
    "round": False,
    "gap": 1,
    "radius": 0
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))