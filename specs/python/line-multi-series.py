import vgplot as vg

bls_unemp = vg.parquet("data/bls-metro-unemployment.parquet")

curr = vg.selection.intersect()

view = vg.plot(
    vg.rule_y(data=[0]),
    vg.line_y(
        data="bls_unemp",
        optimize=False,
        x="date",
        y="unemployment",
        z="division",
        stroke="steelblue",
        stroke_opacity=0.9,
        curve="monotone-x",
    ),
    vg.nearest_x(channels=["z"], bind=curr),
    vg.highlight(by=curr),
    vg.dot(
        bls_unemp,
        x="date",
        y="unemployment",
        z="division",
        r=2,
        fill="currentColor",
        select="nearestX",
    ),
    vg.text(
        bls_unemp,
        x="date",
        y="unemployment",
        text="division",
        fill="currentColor",
        dy=-8,
        select="nearestX",
    ),
    vg.margin_left(24),
    vg.x_label(None),
    vg.x_ticks(10),
    vg.y_label("Unemployment (%)"),
    vg.y_grid(True),
    vg.style("overflow: visible;"),
    vg.width(680),
)

spec = vg.spec()
