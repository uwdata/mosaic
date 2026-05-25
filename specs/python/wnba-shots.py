import vgplot as vg

shots = vg.parquet(
    "data/wnba-shots-2023.parquet",
    where="NOT starts_with(type, 'Free Throw') AND season_type = 2",
)
court = vg.parquet("data/wnba-half-court.parquet")

filter = vg.selection.crossfilter()
binWidth = vg.param(18)

view = vg.vconcat(
    vg.hconcat(
        vg.menu(source="shots", column="team_name", bind=filter, label="Team"),
        vg.menu(
            source="shots",
            column="athlete_name",
            filter_by=filter,
            bind=filter,
            label="Athlete",
        ),
    ),
    vg.vspace(5),
    vg.plot(
        vg.frame(stroke_opacity=0.5),
        vg.hexgrid(bin_width=binWidth, stroke_opacity=0.05),
        vg.hexbin(
            data="shots",
            filter_by=filter,
            bin_width=binWidth,
            x="x_position",
            y="y_position",
            fill=vg.avg("score_value"),
            r=vg.count(),
            tip={"format": {"x": False, "y": False}},
        ),
        vg.line(court, stroke_linecap="butt", stroke_opacity=0.5, x="x", y="y", z="z"),
        vg.name("shot-chart"),
        vg.x_axis(None),
        vg.y_axis(None),
        vg.margin(5),
        vg.x_domain([0, 50]),
        vg.y_domain([0, 40]),
        vg.color_domain("Fixed"),
        vg.color_scheme("YlOrRd"),
        vg.color_scale("linear"),
        vg.color_label("Avg. Shot Value"),
        vg.r_scale("log"),
        vg.r_range([3, 9]),
        vg.r_label("Shot Count"),
        vg.aspect_ratio(1),
        vg.width(510),
    ),
    vg.color_legend(plot="shot-chart"),
)

spec = vg.spec()
