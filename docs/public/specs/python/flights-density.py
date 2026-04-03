import json
import vgplot as vg

meta = vg.meta(title="Flights Density", description="Density `heatmap` and `contour` lines for 200,000+ flights by departure hour and arrival delay. The sliders adjust the smoothing (bandwidth) and number of contour thresholds.\n")
data = vg.data(
    flights=vg.parquet("data/flights-200k.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.slider(label="Bandwidth (σ)", as_="$bandwidth", min=1, max=100),
            vg.slider(label="Thresholds", as_="$thresholds", min=2, max=20)
        ),
    vg.plot(
            vg.heatmap(data=vg.from_("flights"), x="time", y="delay", fill="density", bandwidth="$bandwidth"),
            vg.contour(data=vg.from_("flights"), x="time", y="delay", stroke="white", stroke_opacity=0.5, bandwidth="$bandwidth", thresholds="$thresholds"),
            vg.color_scale("symlog"),
            vg.color_scheme("ylgnbu"),
            vg.x_axis("top"),
            vg.x_label_anchor("center"),
            vg.x_zero(True),
            vg.y_axis("right"),
            vg.y_label_anchor("center"),
            vg.margin_top(30),
            vg.margin_left(5),
            vg.margin_right(40),
            vg.width(700),
            vg.height(500)
        )
)

params = {
    "bandwidth": 7,
    "thresholds": 10
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))