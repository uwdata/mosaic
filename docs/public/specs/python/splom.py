import json
import vgplot as vg

meta = vg.meta(title="Scatter Plot Matrix (SPLOM)", description="A scatter plot matrix enables inspection of pairwise bivariate distributions. Do points cluster or separate in some dimensions but not others? Select a region to highlight corresponding points across all plots.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="body_mass", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.y_axis("left"),
                        vg.margin_left(45),
                        vg.width(185)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_depth", y="body_mass", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="flipper_length", y="body_mass", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="body_mass", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    )
        ),
    vg.hconcat(
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="flipper_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.y_axis("left"),
                        vg.margin_left(45),
                        vg.width(185)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_depth", y="flipper_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="flipper_length", y="flipper_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="flipper_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    )
        ),
    vg.hconcat(
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.y_axis("left"),
                        vg.margin_left(45),
                        vg.width(185)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_depth", y="bill_depth", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="flipper_length", y="bill_depth", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="bill_depth", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        }
                    )
        ),
    vg.hconcat(
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.y_axis("left"),
                        vg.x_axis("bottom"),
                        vg.margin_left(45),
                        vg.margin_bottom(35),
                        vg.width(185),
                        vg.height(175)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="bill_depth", y="bill_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.x_axis("bottom"),
                        vg.height(175),
                        vg.margin_bottom(35)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="flipper_length", y="bill_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.x_axis("bottom"),
                        vg.height(175),
                        vg.margin_bottom(35)
                    ),
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="bill_length", fill="species", r=2),
                        {
                            "select": "intervalXY",
                            "as": "$brush"
                        },
                        {
                            "select": "highlight",
                            "by": "$brush",
                            "opacity": 0.1
                        },
                        vg.x_axis("bottom"),
                        vg.height(175),
                        vg.margin_bottom(35)
                    )
        )
)

params = {
    "brush": {
    "select": "single"
}
}

spec = vg.spec(meta=meta, data=data, params=params, plotDefaults={
    "xTicks": 3,
    "yTicks": 4,
    "xDomain": "Fixed",
    "yDomain": "Fixed",
    "colorDomain": "Fixed",
    "marginTop": 5,
    "marginBottom": 10,
    "marginLeft": 10,
    "marginRight": 5,
    "xAxis": None,
    "yAxis": None,
    "xLabelAnchor": "center",
    "yLabelAnchor": "center",
    "xTickFormat": "s",
    "yTickFormat": "s",
    "width": 150,
    "height": 150
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))