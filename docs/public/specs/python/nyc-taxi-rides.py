import vgplot as vg

rides = vg.parquet(
    "https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/nyc-rides-2010.parquet",
    select=[
        "pickup_datetime::TIMESTAMP AS datetime",
        "ST_Transform(ST_Point(pickup_latitude, pickup_longitude), 'EPSG:4326', 'ESRI:102718') AS pick",
        "ST_Transform(ST_Point(dropoff_latitude, dropoff_longitude), 'EPSG:4326', 'ESRI:102718') AS drop",
    ],
)
trips = vg.table(
    "SELECT\n  (HOUR(datetime) + MINUTE(datetime)/60) AS time,\n  ST_X(pick) AS px, ST_Y(pick) AS py,\n  ST_X(drop) AS dx, ST_Y(drop) AS dy\nFROM rides"
)

filter = vg.selection.crossfilter()

view = vg.vconcat(
    vg.hconcat(
        vg.plot(
            vg.raster(data="trips", filter_by=filter, x="px", y="py", bandwidth=0),
            vg.interval_xy(bind=filter),
            vg.text(
                data=[
                    {"label": "Taxi Pickups"},
                ],
                dx=10,
                dy=10,
                text="label",
                fill="black",
                font_size="1.2em",
                frame_anchor="top-left",
            ),
            vg.width(335),
            vg.height(550),
            vg.margin(0),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.x_domain([975000, 1005000]),
            vg.y_domain([190000, 240000]),
            vg.color_scale("symlog"),
            vg.color_scheme("blues"),
        ),
        vg.hspace(10),
        vg.plot(
            vg.raster(data="trips", filter_by=filter, x="dx", y="dy", bandwidth=0),
            vg.interval_xy(bind=filter),
            vg.text(
                data=[
                    {"label": "Taxi Dropoffs"},
                ],
                dx=10,
                dy=10,
                text="label",
                fill="black",
                font_size="1.2em",
                frame_anchor="top-left",
            ),
            vg.width(335),
            vg.height(550),
            vg.margin(0),
            vg.x_axis(None),
            vg.y_axis(None),
            vg.x_domain([975000, 1005000]),
            vg.y_domain([190000, 240000]),
            vg.color_scale("symlog"),
            vg.color_scheme("oranges"),
        ),
    ),
    vg.vspace(10),
    vg.plot(
        vg.rect_y(trips, x=vg.bin("time"), y=vg.count(), fill="steelblue", inset=0.5),
        vg.interval_x(bind=filter),
        vg.y_tick_format("s"),
        vg.x_label("Pickup Hour →"),
        vg.width(680),
        vg.height(100),
    ),
    config={"extensions": "spatial"},
)
