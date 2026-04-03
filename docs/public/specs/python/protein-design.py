import json
import vgplot as vg

meta = vg.meta(title="Protein Design Explorer", description="Explore synthesized proteins generated via\n[RFDiffusion](https://www.bakerlab.org/2023/07/11/diffusion-model-for-protein-design/).\n\"Minibinders\" are small proteins that bind to a specific protein target.\nWhen designing a minibinder, a researcher inputs the structure of the\ntarget protein and other parameters into the AI diffusion model. Often, a\nsingle, promising (parent) _version_ can be run through the model again to\nproduce additional, similar designs to better sample the design space.\n\nThe pipeline generates tens of thousands of protein designs. The metric\n_pAE_ (predicted alignment error) measures how accurate a model was at\npredicting the minibinder shape, whereas _pLDDT_ (predicted local distance\ndifference test) measures a model's confidence in minibinder structure\nprediction. For _pAE_ lower is better, for _pLDDT_ higher is better.\n\nAdditional parameters include _partial t_ to set the time steps used by\nthe model, _noise_ to create more diversity of designs, _gradient decay\nfunction_ and _gradient scale_ to guide prioritizing different positions\nat different time points, and _movement_ to denote whether the minibinder\nwas left in its original position (\"og\") or moved to a desirable position\n(\"moved\").\n\nThe dashboard below enables exploration of the results to identify\npromising protein designs and assess the effects of process parameters.\n", credit="Adapted from a [UW CSE 512](https://courses.cs.washington.edu/courses/cse512/24sp/) project by Christina Savvides, Alexander Shida, Riti Biswas, and Nora McNamara-Bordewick. Data from the [UW Institute for Protein Design](https://www.ipd.uw.edu/).\n")
data = vg.data(
    proteins=vg.parquet("data/protein-design.parquet")
)

view = vg.vconcat(
    vg.hconcat(
            vg.input("menu", from_="proteins", column="partial_t", label="Partial t", as_="$query"),
            vg.input("menu", from_="proteins", column="noise", label="Noise", as_="$query"),
            vg.input("menu", from_="proteins", column="gradient_decay_function", label="Gradient Decay", as_="$query"),
            vg.input("menu", from_="proteins", column="gradient_scale", label="Gradient Scale", as_="$query")
        ),
    {
        "vspace": "1.5em"
    },
    vg.hconcat(
            vg.plot(
                        vg.rect_y(data={
                            "from": "proteins",
                            "filterBy": "$query"
                        }, x={
                            "bin": "plddt_total",
                            "steps": 60
                        }, y={
                            "count": ""
                        }, z="version", fill="version", order="z", reverse=True, inset_left=0.5, inset_right=0.5),
                        vg.width(600),
                        vg.height(55),
                        vg.x_axis(None),
                        vg.y_axis(None),
                        vg.x_domain("$plddt_domain"),
                        vg.color_domain("Fixed"),
                        vg.color_scheme("$scheme"),
                        vg.margin_left(40),
                        vg.margin_right(0),
                        vg.margin_top(0),
                        vg.margin_bottom(0)
                    ),
            {
                "hspace": 5
            },
            {
                "legend": "color",
                "for": "scatter",
                "columns": 1,
                "as": "$query"
            }
        ),
    vg.hconcat(
            vg.plot(
                        vg.frame(stroke="#ccc"),
                        vg.raster(data={
                            "from": "proteins",
                            "filterBy": "$query"
                        }, x="plddt_total", y="pae_interaction", fill="version", pad=0),
                        {
                            "select": "intervalXY",
                            "as": "$query",
                            "brush": {
                            "stroke": "currentColor",
                            "fill": "transparent"
                        }
                        },
                        vg.dot(data={
                            "from": "proteins",
                            "filterBy": "$point"
                        }, x="plddt_total", y="pae_interaction", fill="version", stroke="currentColor", stroke_width=0.5),
                        vg.name("scatter"),
                        vg.opacity_domain([
                            0,
                            2
                        ]),
                        vg.opacity_clamp(True),
                        vg.color_domain("Fixed"),
                        vg.color_scheme("$scheme"),
                        vg.x_domain("$plddt_domain"),
                        vg.y_domain("$pae_domain"),
                        vg.x_label_anchor("center"),
                        vg.y_label_anchor("center"),
                        vg.margin_top(0),
                        vg.margin_left(40),
                        vg.margin_right(0),
                        vg.width(600),
                        vg.height(450)
                    ),
            vg.plot(
                        vg.rect_x(data={
                            "from": "proteins",
                            "filterBy": "$query"
                        }, x={
                            "count": ""
                        }, y={
                            "bin": "pae_interaction",
                            "steps": 60
                        }, z="version", fill="version", order="z", reverse=True, inset_top=0.5, inset_bottom=0.5),
                        vg.width(55),
                        vg.height(450),
                        vg.x_axis(None),
                        vg.y_axis(None),
                        vg.margin_top(0),
                        vg.margin_left(0),
                        vg.margin_right(0),
                        vg.y_domain("$pae_domain"),
                        vg.color_domain("Fixed"),
                        vg.color_scheme("$scheme")
                    )
        ),
    {
        "vspace": "1em"
    },
    vg.input("table", as_="$point", filter_by="$query", from_="proteins", columns=[
        "version",
        "pae_interaction",
        "plddt_total",
        "noise",
        "gradient_decay_function",
        "gradient_scale",
        "movement"
    ], width=680, height=215)
)

params = {
    "query": {
    "select": "crossfilter"
},
    "point": {
    "select": "intersect",
    "empty": True
},
    "plddt_domain": [
    67,
    94.5
],
    "pae_domain": [
    5,
    29
],
    "scheme": "observable10"
}

spec = vg.spec(meta=meta, data=data, params=params, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))