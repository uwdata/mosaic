import vgplot as vg

_meta = vg.meta(title="Pan & Zoom", description="Linked panning and zooming across plots: drag to pan, scroll to zoom. `panZoom` interactors update a set of bound selections, one per unique axis.\n")
_data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

xs = vg.Selection.intersect()
ys = vg.Selection.intersect()
zs = vg.Selection.intersect()
ws = vg.Selection.intersect()

_view = vg.hconcat(
    vg.vconcat(
        vg.plot(
            vg.frame(),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", r=2, clip=True),
            {
                "select": "panZoom",
                "x": xs,
                "y": ys
            },
            vg.width(320),
            vg.height(240)
        ),
        vg.vspace(10),
        vg.plot(
            vg.frame(),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="flipper_length", fill="species", r=2, clip=True),
            {
                "select": "panZoom",
                "x": xs,
                "y": zs
            },
            vg.width(320),
            vg.height(240)
        )
    ),
    vg.hspace(10),
    vg.vconcat(
        vg.plot(
            vg.frame(),
            vg.dot(data=vg.from_("penguins"), x="body_mass", y="bill_depth", fill="species", r=2, clip=True),
            {
                "select": "panZoom",
                "x": ws,
                "y": ys
            },
            vg.width(320),
            vg.height(240)
        ),
        vg.vspace(10),
        vg.plot(
            vg.frame(),
            vg.dot(data=vg.from_("penguins"), x="body_mass", y="flipper_length", fill="species", r=2, clip=True),
            {
                "select": "panZoom",
                "x": ws,
                "y": zs
            },
            vg.width(320),
            vg.height(240)
        )
    )
)

spec = vg.spec(meta=_meta, data=_data, params={"xs": xs, "ys": ys, "zs": zs, "ws": ws}, view=_view)