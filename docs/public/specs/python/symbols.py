import json
import vgplot as vg

meta = vg.meta(title="Symbol Plots", description="Two scatter plots with `dot` marks: one with stroked symbols, the other filled. Drop-down menus control which data table columns are plotted.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", label="Y", options=[
                "body_mass",
                "flipper_length",
                "bill_depth",
                "bill_length"
            ], as_="$y"),
            vg.input("menu", label="X", options=[
                "body_mass",
                "flipper_length",
                "bill_depth",
                "bill_length"
            ], as_="$x")
        ),
    {
        "vspace": 10
    },
    vg.hconcat(
            vg.plot(
                        vg.dot(data=vg.from_("penguins"), x={
                            "column": "$x"
                        }, y={
                            "column": "$y"
                        }, stroke="species", symbol="species"),
                        vg.name("stroked"),
                        vg.grid(True),
                        vg.x_label("Body mass (g) →"),
                        vg.y_label("↑ Flipper length (mm)")
                    ),
            {
                "legend": "symbol",
                "for": "stroked",
                "columns": 1
            }
        ),
    {
        "vspace": 20
    },
    vg.hconcat(
            vg.plot(
                        vg.dot(data=vg.from_("penguins"), x={
                            "column": "$x"
                        }, y={
                            "column": "$y"
                        }, fill="species", symbol="species"),
                        vg.name("filled"),
                        vg.grid(True),
                        vg.x_label("Body mass (g) →"),
                        vg.y_label("↑ Flipper length (mm)")
                    ),
            {
                "legend": "symbol",
                "for": "filled",
                "columns": 1
            }
        )
)

params = {
    "x": "body_mass",
    "y": "flipper_length"
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))