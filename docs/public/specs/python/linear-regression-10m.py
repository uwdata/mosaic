import vgplot as vg

flights10m = vg.table(
    "SELECT GREATEST(-60, LEAST(ARR_DELAY, 180))::DOUBLE AS delay, DISTANCE AS distance, DEP_TIME AS time FROM 'https://pub-1da360b43ceb401c809f68ca37c7f8a4.r2.dev/data/flights-10m.parquet'"
)
flights10p = vg.table("SELECT * FROM flights10m USING SAMPLE 10%")
flights5p = vg.table("SELECT * FROM flights10m USING SAMPLE 5%")
flights1p = vg.table("SELECT * FROM flights10m USING SAMPLE 1%")

data = vg.param("flights10m")
query = vg.selection.intersect()

view = vg.vconcat(
    vg.menu(
        label="Sample",
        bind=data,
        options=[
            vg.option("Full Data", value="flights10m"),
            vg.option("10% Sample", value="flights10p"),
            vg.option("5% Sample", value="flights5p"),
            vg.option("1% Sample", value="flights1p"),
        ],
    ),
    vg.vspace(10),
    vg.plot(
        vg.raster(
            data=data,
            x="time",
            y="delay",
            pixel_size=4,
            pad=0,
            image_rendering="pixelated",
        ),
        vg.regression_y(data=data, x="time", y="delay", stroke="gray"),
        vg.regression_y(
            data=data, filter_by=query, x="time", y="delay", stroke="firebrick"
        ),
        vg.interval_xy(
            bind=query, brush=vg.brush(fill_opacity=0, stroke="currentColor")
        ),
        vg.x_domain([0, 24]),
        vg.y_domain([-60, 180]),
        vg.color_scale("symlog"),
        vg.color_scheme("blues"),
        vg.color_domain("Fixed"),
    ),
)

spec = vg.spec()
