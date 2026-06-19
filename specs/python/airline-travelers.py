import vgplot as vg

travelers = vg.parquet("data/travelers.parquet")
endpoint = vg.table("SELECT * FROM travelers ORDER BY date DESC LIMIT 1")

view = vg.plot(
    vg.rule_y(data=[0]),
    vg.line_y(travelers, x="date", y="previous", stroke_opacity=0.35),
    vg.line_y(travelers, x="date", y="current"),
    vg.text(
        endpoint,
        x="date",
        y="previous",
        text=["2019"],
        fill_opacity=0.5,
        line_anchor="bottom",
        dy=-6,
    ),
    vg.text(endpoint, x="date", y="current", text=["2020"], line_anchor="top", dy=6),
    vg.y_grid(True),
    vg.y_label("↑ Travelers per day"),
    vg.y_tick_format("s"),
)

spec = vg.spec(view)
