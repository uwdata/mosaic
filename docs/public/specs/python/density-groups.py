import json
import vgplot as vg

meta = vg.meta(title="Density Groups", description="Density plots of penguin bill depths, grouped by species. The normalize parameter supports different forms of comparison, controlling if an individual density estimate is scaled by total point mass or normalized by the sum or max of the point mass. The stack and offset parameters control stacking of density areas.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", label="Normalize", as_="$normalize", options=[
                "none",
                "sum",
                "max"
            ]),
            vg.input("menu", label="Stack", as_="$stack", options=[
                False,
                True
            ]),
            vg.input("menu", label="Offset", as_="$offset", options=[
                {
                "label": "none",
                "value": None
            },
                {
                "label": "normalize",
                "value": "normalize"
            },
                {
                "label": "center",
                "value": "center"
            }
            ])
        ),
    vg.plot(
            vg.density_y(data=vg.from_("penguins"), x="bill_depth", fill="species", fill_opacity=0.4, bandwidth="$bandwidth", normalize="$normalize", stack="$stack", offset="$offset"),
            vg.margin_left(50),
            vg.height(200)
        )
)

params = {
    "bandwidth": 20,
    "normalize": "none",
    "stack": False,
    "offset": None
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))