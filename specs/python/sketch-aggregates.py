import vgplot as vg

athletes = vg.parquet("data/athletes.parquet")

brush = vg.selection.intersect()

view = vg.vconcat(
    vg.plot(
        vg.rect_y(
            athletes, x=vg.bin("height"), y=vg.count(), fill="steelblue", inset=0.5
        ),
        vg.interval_x(bind=brush),
        vg.x_label("Height (m) →"),
        vg.y_label("↑ Athletes"),
        vg.width(700),
        vg.height(150),
    ),
    vg.hconcat(
        vg.plot(
            vg.bar_x(
                data=athletes,
                filter_by=brush,
                x=vg.median("weight"),
                y="sport",
                fill="steelblue",
                sort=vg.sort(y="-x"),
            ),
            vg.x_label("Median weight (kg) →"),
            vg.y_label(None),
            vg.margin_left(110),
            vg.width(350),
            vg.height(500),
        ),
        vg.plot(
            vg.bar_x(
                data=athletes,
                filter_by=brush,
                x=vg.count("nationality", distinct=True),
                y="sport",
                fill="steelblue",
                sort=vg.sort(y="-x"),
            ),
            vg.x_label("Distinct nationalities →"),
            vg.y_label(None),
            vg.margin_left(110),
            vg.width(350),
            vg.height(500),
        ),
    ),
)
