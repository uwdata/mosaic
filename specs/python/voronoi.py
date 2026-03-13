import json
import mosaic.vgplot as vg

meta = vg.meta(title="Voronoi Diagram", description="The `voronoi` mark shows the regions closest to each point. It is [constructed from its dual](https://observablehq.com/@mbostock/the-delaunays-dual), a Delaunay triangle mesh. Reveal triangulations or convex hulls using the dropdowns.\n", credit="Adapted from an [Observable Plot example](https://observablehq.com/@observablehq/plot-voronoi-scatterplot).")
data = vg.data(
    penguins=vg.parquet("data/penguins.parquet")
)

view = vg.vconcat(
    vg.plot(
            vg.voronoi(data=vg.from_("penguins"), x="bill_length", y="bill_depth", stroke="white", stroke_width=1, stroke_opacity=0.5, fill="species", fill_opacity=0.2),
            vg.hull(data=vg.from_("penguins"), x="bill_length", y="bill_depth", stroke="species", stroke_opacity="$hull", stroke_width=1.5),
            vg.delaunay_mesh(data=vg.from_("penguins"), x="bill_length", y="bill_depth", z="species", stroke="species", stroke_opacity="$mesh", stroke_width=1),
            vg.dot(data=vg.from_("penguins"), x="bill_length", y="bill_depth", fill="species", r=2),
            vg.frame(),
            vg.inset(10),
            vg.width(680)
        ),
    vg.hconcat(
            vg.input("menu", label="Delaunay Mesh", options=[
                {
                "value": 0,
                "label": "Hide"
            },
                {
                "value": 0.5,
                "label": "Show"
            }
            ], as_="$mesh"),
            {
                "hspace": 5
            },
            vg.input("menu", label="Convex Hull", options=[
                {
                "value": 0,
                "label": "Hide"
            },
                {
                "value": 1,
                "label": "Show"
            }
            ], as_="$hull")
        )
)

spec = vg.spec(meta=meta, data=data, params={
    "mesh": 0,
    "hull": 0
}, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))