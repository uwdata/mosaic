import json
import vgplot as vg

meta = vg.meta(title="Contour Plot", description="Here `heatmap` and `contour` marks visualize the density of data points in a scatter plot of penguin measurments. Setting the `fill` color to `\"species\"` subdivides the data into three sets of densities.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.slider(label="Bandwidth (σ)", as_="$bandwidth", min=1, max=100),
            vg.slider(label="Thresholds", as_="$thresholds", min=2, max=20)
        ),
    vg.plot(
            vg.heatmap(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", bandwidth="$bandwidth"),
            vg.contour(data=vg.from_("penguins"), x="bill_length", y="bill_depth", stroke="species", bandwidth="$bandwidth", thresholds="$thresholds"),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="currentColor", r=1),
            vg.x_axis("bottom"),
            vg.x_label_anchor("center"),
            vg.y_axis("right"),
            vg.y_label_anchor("center"),
            vg.margins(top=5, bottom=30, left=5, right=50),
            vg.width(700),
            vg.height(480)
        )
)

params = {
    "bandwidth": 40,
    "thresholds": 10
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))