import json
import mosaic.vgplot as vg

meta = vg.meta(title="Mark Types", description="A subset of supported mark types.\n\n- Row 1: `barY`, `lineY`, `text`, `tickY`, `areaY`\n- Row 2: `regressionY`, `hexbin`, `contour`, `heatmap`, `denseLine`\n")
data = vg.data(
    md={
    "type": "json",
    "data": [
    {
    "i": 0,
    "u": "A",
    "v": 2
},
    {
    "i": 1,
    "u": "B",
    "v": 8
},
    {
    "i": 2,
    "u": "C",
    "v": 3
},
    {
    "i": 3,
    "u": "D",
    "v": 7
},
    {
    "i": 4,
    "u": "E",
    "v": 5
},
    {
    "i": 5,
    "u": "F",
    "v": 4
},
    {
    "i": 6,
    "u": "G",
    "v": 6
},
    {
    "i": 7,
    "u": "H",
    "v": 1
}
]
}
)

view = vg.vconcat(
    vg.hconcat(
            vg.plot(
                        vg.bar_y(data=vg.from_("md"), x="u", y="v", fill="steelblue")
                    ),
            vg.plot(
                        vg.line_y(data=vg.from_("md"), x="u", y="v", stroke="steelblue", curve="monotone-x", marker="circle")
                    ),
            vg.plot(
                        vg.text(data=vg.from_("md"), x="u", y="v", text="u", fill="steelblue")
                    ),
            vg.plot(
                        vg.tick_y(data=vg.from_("md"), x="u", y="v", stroke="steelblue")
                    ),
            vg.plot(
                        vg.area_y(data=vg.from_("md"), x="u", y="v", fill="steelblue")
                    )
        ),
    vg.hconcat(
            vg.plot(
                        vg.dot(data=vg.from_("md"), x="i", y="v", fill="currentColor", r=1.5),
                        vg.regression_y(data=vg.from_("md"), x="i", y="v", stroke="steelblue"),
                        vg.x_domain([
                            -0.5,
                            7.5
                        ])
                    ),
            vg.plot(
                        vg.hexgrid(stroke="#aaa", stroke_opacity=0.5),
                        vg.hexbin(data=vg.from_("md"), x="i", y="v", fill={
                            "count": ""
                        }),
                        vg.color_scheme("blues"),
                        vg.x_domain([
                            -1,
                            8
                        ])
                    ),
            vg.plot(
                        vg.contour(data=vg.from_("md"), x="i", y="v", stroke="steelblue", bandwidth=15),
                        vg.x_domain([
                            -1,
                            8
                        ])
                    ),
            vg.plot(
                        vg.heatmap(data=vg.from_("md"), x="i", y="v", fill="density", bandwidth=15),
                        vg.color_scheme("blues"),
                        vg.x_domain([
                            -1,
                            8
                        ])
                    ),
            vg.plot(
                        vg.dense_line(data=vg.from_("md"), x="i", y="v", fill="density", bandwidth=2, pixel_size=1),
                        vg.color_scheme("blues"),
                        vg.x_domain([
                            -1,
                            8
                        ])
                    )
        )
)

spec = vg.spec(meta=meta, data=data, plotDefaults={
    "xAxis": None,
    "yAxis": None,
    "margins": {
    "left": 5,
    "top": 5,
    "right": 5,
    "bottom": 5
},
    "width": 160,
    "height": 100,
    "yDomain": [
    0,
    9
]
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))