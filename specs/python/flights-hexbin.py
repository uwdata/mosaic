import json
import vgplot as vg

meta = vg.meta(title="Flights Hexbin", description="Hexagonal bins show the density of over 200,000 flights by departure time and arrival delay. Select regions in the marginal histograms to filter the density display.\n")
data = vg.data(
    flights=vg.parquet("data/flights-200k.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", label="Color Scale", as_="$scale", options=[
                "log",
                "linear",
                "sqrt"
            ]),
            {
                "hspace": 10
            },
            {
                "legend": "color",
                "for": "hexbins"
            }
        ),
    vg.hconcat(
            vg.plot(
                        vg.rect_y(data=vg.from_("flights"), x={
                            "bin": "time"
                        }, y={
                            "count": ""
                        }, fill="steelblue", inset=0.5),
                        {
                            "select": "intervalX",
                            "as": "$query"
                        },
                        vg.margins(left=5, right=5, top=30, bottom=0),
                        vg.x_domain("Fixed"),
                        vg.x_axis("top"),
                        vg.y_axis(None),
                        vg.x_label_anchor("center"),
                        vg.width(605),
                        vg.height(70)
                    ),
            {
                "hspace": 80
            }
        ),
    vg.hconcat(
            vg.plot(
                        vg.hexbin(data={
                            "from": "flights",
                            "filterBy": "$query"
                        }, x="time", y="delay", fill={
                            "count": ""
                        }, bin_width=10),
                        vg.hexgrid(bin_width=10),
                        vg.name("hexbins"),
                        vg.color_scheme("ylgnbu"),
                        vg.color_scale("$scale"),
                        vg.margins(left=5, right=0, top=0, bottom=5),
                        vg.x_axis(None),
                        vg.y_axis(None),
                        vg.xy_domain("Fixed"),
                        vg.width(600),
                        vg.height(455)
                    ),
            vg.plot(
                        vg.rect_x(data=vg.from_("flights"), x={
                            "count": ""
                        }, y={
                            "bin": "delay"
                        }, fill="steelblue", inset=0.5),
                        {
                            "select": "intervalY",
                            "as": "$query"
                        },
                        vg.margins(left=0, right=50, top=4, bottom=5),
                        vg.y_domain([
                            -60,
                            180
                        ]),
                        vg.x_axis(None),
                        vg.y_axis("right"),
                        vg.y_label_anchor("center"),
                        vg.width(80),
                        vg.height(455)
                    )
        )
)

params = {
    "scale": "log",
    "query": {
    "select": "intersect"
}
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))