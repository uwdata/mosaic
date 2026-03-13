import json
import mosaic.vgplot as vg

meta = vg.meta(title="Density 2D", description="A 2D `density` plot in which circle size indicates the point density. The data is divided by fill color into three sets of densities. To change the amount of smoothing, use the slider to set the kernel bandwidth.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.slider(label="Bandwidth (σ)", as_="$bandwidth", min=1, max=100),
            vg.slider(label="Bins", as_="$bins", min=10, max=60)
        ),
    vg.plot(
            vg.density(data=vg.from_("penguins"), x="bill_length", y="bill_depth", r="density", fill="species", fill_opacity=0.5, width="$bins", height="$bins", bandwidth="$bandwidth"),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="currentColor", r=1),
            vg.r_range([
                0,
                16
            ]),
            vg.x_axis("bottom"),
            vg.x_label_anchor("center"),
            vg.y_axis("right"),
            vg.y_label_anchor("center"),
            vg.margins(top=5, bottom=30, left=5, right=50),
            vg.width(700),
            vg.height(480)
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "bandwidth": 20,
    "bins": 20
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))