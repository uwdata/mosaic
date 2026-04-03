import json
import vgplot as vg

meta = vg.meta(title="Axes & Gridlines", description="Customized axis and gridline marks can be used in addition to standard scale attributes such as `xAxis`, `yGrid`, etc. Just add data!\n")
data = {}

view = vg.plot(
    vg.grid_y(stroke_dasharray="0.75 2", stroke_opacity=1),
    vg.axis_y(anchor="left", tick_size=0, dx=38, dy=-4, line_anchor="bottom"),
    vg.axis_y(anchor="right", tick_size=0, tick_padding=5, label="y-axis", label_anchor="center"),
    vg.axis_x(label="x-axis", label_anchor="center"),
    vg.grid_x(),
    vg.rule_y(data=[
        0
    ]),
    vg.x_domain([
        0,
        100
    ]),
    vg.y_domain([
        0,
        100
    ]),
    vg.x_inset_left(36),
    vg.margin_left(0),
    vg.margin_right(35),
    vg.width(680)
)

spec = vg.spec(meta=meta, view=view)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))