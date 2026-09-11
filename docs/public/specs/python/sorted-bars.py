import vgplot as vg

athletes = vg.parquet("data/athletes.parquet")

query = vg.selection.intersect()

view = vg.vconcat(
    vg.menu(
        label="Sport", bind=query, source=athletes, column="sport", value="aquatics"
    ),
    vg.vspace(10),
    vg.plot(
        vg.bar_x(
            data=athletes,
            filter_by=query,
            x=vg.sum("gold"),
            y="nationality",
            fill="steelblue",
            sort=vg.sort(y="-x", limit=10),
        ),
        vg.x_label("Gold Medals"),
        vg.y_label("Nationality"),
        vg.y_label_anchor("top"),
        vg.margin_top(15),
    ),
)
