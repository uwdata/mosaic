import json
import mosaic.vgplot as vg

meta = vg.meta(title="Pan & Zoom", description="Linked panning and zooming across plots: drag to pan, scroll to zoom. `panZoom` interactors update a set of bound selections, one per unique axis.\n")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.hconcat(
    vg.vconcat(
            vg.plot(
                        vg.frame(),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", r=2, clip=True),
                        {
                            "select": "panZoom",
                            "x": "$xs",
                            "y": "$ys"
                        },
                        vg.width(320),
                        vg.height(240)
                    ),
            {
                "vspace": 10
            },
            vg.plot(
                        vg.frame(),
                        vg.dot(data=vg.from_("penguins"), x="bill_length", y="flipper_length", fill="species", r=2, clip=True),
                        {
                            "select": "panZoom",
                            "x": "$xs",
                            "y": "$zs"
                        },
                        vg.width(320),
                        vg.height(240)
                    )
        ),
    {
        "hspace": 10
    },
    vg.vconcat(
            vg.plot(
                        vg.frame(),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="bill_depth", fill="species", r=2, clip=True),
                        {
                            "select": "panZoom",
                            "x": "$ws",
                            "y": "$ys"
                        },
                        vg.width(320),
                        vg.height(240)
                    ),
            {
                "vspace": 10
            },
            vg.plot(
                        vg.frame(),
                        vg.dot(data=vg.from_("penguins"), x="body_mass", y="flipper_length", fill="species", r=2, clip=True),
                        {
                            "select": "panZoom",
                            "x": "$ws",
                            "y": "$zs"
                        },
                        vg.width(320),
                        vg.height(240)
                    )
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "xs": {
    "select": "intersect"
},
    "ys": {
    "select": "intersect"
},
    "zs": {
    "select": "intersect"
},
    "ws": {
    "select": "intersect"
}
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))