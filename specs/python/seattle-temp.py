import vgplot as vg

weather = vg.parquet("data/seattle-weather.parquet")

view = vg.plot(
    vg.area_y(
        weather,
        x=vg.date_month("date"),
        y1=vg.max("temp_max"),
        y2=vg.min("temp_min"),
        fill="#ccc",
        fill_opacity=0.25,
        curve="monotone-x",
    ),
    vg.area_y(
        weather,
        x=vg.date_month("date"),
        y1=vg.avg("temp_max"),
        y2=vg.avg("temp_min"),
        fill="steelblue",
        fill_opacity=0.75,
        curve="monotone-x",
    ),
    vg.rule_y(data=[15], stroke_opacity=0.5, stroke_dasharray="5 5"),
    vg.x_tick_format("%b"),
    vg.y_label("Temperature Range (°C)"),
    vg.width(680),
    vg.height(300),
)
