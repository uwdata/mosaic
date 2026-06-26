import vgplot as vg

athletes = vg.parquet("data/athletes.parquet")

category = vg.selection.intersect()
query = vg.selection.intersect(include=[category])
hover = vg.selection.intersect(empty=True)

view = vg.hconcat(
    vg.vconcat(
        vg.hconcat(
            vg.menu(label="Sport", bind=category, source=athletes, column="sport"),
            vg.menu(label="Sex", bind=category, source=athletes, column="sex"),
            vg.search(
                label="Name",
                filter_by=category,
                bind=query,
                source=athletes,
                column="name",
                type="contains",
            ),
        ),
        vg.vspace(10),
        vg.plot(
            vg.dot(
                data=athletes,
                filter_by=query,
                x="weight",
                y="height",
                fill="sex",
                r=2,
                opacity=0.1,
            ),
            vg.regression_y(
                data=athletes, filter_by=query, x="weight", y="height", stroke="sex"
            ),
            vg.interval_xy(bind=query, brush=vg.brush(fill_opacity=0, stroke="black")),
            vg.dot(
                data=athletes,
                filter_by=hover,
                x="weight",
                y="height",
                fill="sex",
                stroke="currentColor",
                stroke_width=1,
                r=3,
            ),
            vg.xy_domain("Fixed"),
            vg.color_domain("Fixed"),
            vg.margins(left=35, top=20, right=1),
            vg.width(570),
            vg.height(350),
        ),
        vg.vspace(5),
        vg.table_input(
            source=athletes,
            max_width=570,
            height=250,
            filter_by=query,
            bind=hover,
            columns=["name", "nationality", "sex", "height", "weight", "sport"],
            width={
                "name": 180,
                "nationality": 100,
                "sex": 50,
                "height": 50,
                "weight": 50,
                "sport": 100,
            },
        ),
    )
)
